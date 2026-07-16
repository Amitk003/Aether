import { describe, it, expect } from 'vitest';
import {
  generateKeyPair,
  exportPublicKey,
  importPublicKey,
  exportPrivateKey,
  importPrivateKey,
  deriveSharedSecret,
  encryptMessage,
  decryptMessage,
} from './crypto';

describe('crypto', () => {
  it('generates an ECDH key pair', async () => {
    const keyPair = await generateKeyPair();
    expect(keyPair.publicKey).toBeDefined();
    expect(keyPair.privateKey).toBeDefined();
    expect(keyPair.publicKey.type).toBe('public');
    expect(keyPair.privateKey.type).toBe('private');
  });

  it('exports and imports a public key as JWK', async () => {
    const keyPair = await generateKeyPair();
    const jwk = await exportPublicKey(keyPair.publicKey);
    expect(jwk.kty).toBe('EC');
    expect(jwk.crv).toBe('P-256');
    expect(jwk.x).toBeDefined();
    expect(jwk.y).toBeDefined();

    const imported = await importPublicKey(jwk);
    expect(imported.type).toBe('public');
  });

  it('derives matching shared secrets for both parties', async () => {
    const alice = await generateKeyPair();
    const bob = await generateKeyPair();

    const aliceSecret = await deriveSharedSecret(alice.privateKey, bob.publicKey);
    const bobSecret = await deriveSharedSecret(bob.privateKey, alice.publicKey);

    expect(new Uint8Array(aliceSecret)).toEqual(new Uint8Array(bobSecret));
  });

  it('encrypts and decrypts a message', async () => {
    const alice = await generateKeyPair();
    const bob = await generateKeyPair();

    const sharedSecret = await deriveSharedSecret(alice.privateKey, bob.publicKey);

    const plaintext = new TextEncoder().encode('Hello, this is a secret message!').buffer;
    const encrypted = await encryptMessage(sharedSecret, plaintext);

    expect(encrypted.iv).toHaveLength(12);
    expect(encrypted.ciphertext.byteLength).toBeGreaterThan(0);

    const decrypted = await decryptMessage(sharedSecret, encrypted);
    const decryptedText = new TextDecoder().decode(decrypted);
    expect(decryptedText).toBe('Hello, this is a secret message!');
  });

  it('produces different IVs for the same plaintext (non-deterministic)', async () => {
    const alice = await generateKeyPair();
    const bob = await generateKeyPair();
    const sharedSecret = await deriveSharedSecret(alice.privateKey, bob.publicKey);

    const plaintext = new TextEncoder().encode('same message').buffer;

    const e1 = await encryptMessage(sharedSecret, plaintext);
    const e2 = await encryptMessage(sharedSecret, plaintext);

    expect(e1.iv).not.toEqual(e2.iv);
    expect(e1.ciphertext.byteLength).toBe(e2.ciphertext.byteLength);
  });

  it('fails to decrypt with wrong shared secret', async () => {
    const alice = await generateKeyPair();
    const bob = await generateKeyPair();
    const eve = await generateKeyPair();

    const sharedSecret = await deriveSharedSecret(alice.privateKey, bob.publicKey);
    const wrongSecret = await deriveSharedSecret(eve.privateKey, alice.publicKey);

    const plaintext = new TextEncoder().encode('secret data').buffer;
    const encrypted = await encryptMessage(sharedSecret, plaintext);

    await expect(
      decryptMessage(wrongSecret, encrypted)
    ).rejects.toThrow();
  });

  it('fails to decrypt tampered ciphertext', async () => {
    const alice = await generateKeyPair();
    const bob = await generateKeyPair();
    const sharedSecret = await deriveSharedSecret(alice.privateKey, bob.publicKey);

    const plaintext = new TextEncoder().encode('data integrity check').buffer;
    const encrypted = await encryptMessage(sharedSecret, plaintext);

    const tampered = new Uint8Array(encrypted.ciphertext);
    tampered[0] ^= 0xFF;

    await expect(
      decryptMessage(sharedSecret, {
        iv: encrypted.iv,
        ciphertext: tampered.buffer,
      })
    ).rejects.toThrow();
  });

  it('round-trips a large message (10KB)', async () => {
    const alice = await generateKeyPair();
    const bob = await generateKeyPair();
    const sharedSecret = await deriveSharedSecret(alice.privateKey, bob.publicKey);

    const largeData = new Uint8Array(10240);
    crypto.getRandomValues(largeData);

    const encrypted = await encryptMessage(sharedSecret, largeData.buffer);
    const decrypted = await decryptMessage(sharedSecret, encrypted);

    expect(new Uint8Array(decrypted)).toEqual(largeData);
  });

  it('works with exported and re-imported public keys', async () => {
    const alice = await generateKeyPair();
    const bob = await generateKeyPair();

    const alicePubJwk = await exportPublicKey(alice.publicKey);
    const bobPubJwk = await exportPublicKey(bob.publicKey);

    const alicePubReimported = await importPublicKey(alicePubJwk);
    const bobPubReimported = await importPublicKey(bobPubJwk);

    const aliceSecret = await deriveSharedSecret(alice.privateKey, bobPubReimported);
    const bobSecret = await deriveSharedSecret(bob.privateKey, alicePubReimported);

    expect(new Uint8Array(aliceSecret)).toEqual(new Uint8Array(bobSecret));

    const plaintext = new TextEncoder().encode('export round-trip works').buffer;
    const encrypted = await encryptMessage(aliceSecret, plaintext);
    const decrypted = await decryptMessage(bobSecret, encrypted);
    expect(new TextDecoder().decode(decrypted)).toBe('export round-trip works');
  });

  it('exports and imports a private key as JWK successfully', async () => {
    const keyPair = await generateKeyPair();
    const jwk = await exportPrivateKey(keyPair.privateKey);
    expect(jwk.kty).toBe('EC');
    expect(jwk.crv).toBe('P-256');
    expect(jwk.d).toBeDefined(); // Secret parameter 'd' must exist in private JWK

    const imported = await importPrivateKey(jwk);
    expect(imported.type).toBe('private');
    expect(imported.usages).toContain('deriveBits');
  });
});
