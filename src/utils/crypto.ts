import type { EncryptedMessage, KeyPair } from '../types/crypto';

const ALGORITHM = 'ECDH';
const CURVE = 'P-256';
const ENCRYPTION = 'AES-GCM';
const KEY_LENGTH = 256;
const HASH = 'SHA-256';

const IV_LENGTH = 12;

function getSubtle(): SubtleCrypto {
  return crypto.subtle;
}

export async function generateKeyPair(): Promise<KeyPair> {
  const keyPair = await getSubtle().generateKey(
    {
      name: ALGORITHM,
      namedCurve: CURVE,
    },
    false,
    ['deriveKey', 'deriveBits']
  );

  return keyPair;
}

export async function exportPublicKey(key: CryptoKey): Promise<JsonWebKey> {
  const jwk = await getSubtle().exportKey('jwk', key);
  return jwk;
}

export async function importPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
  const key = await getSubtle().importKey(
    'jwk',
    jwk,
    {
      name: ALGORITHM,
      namedCurve: CURVE,
    },
    true,
    []
  );

  return key;
}

export async function exportPrivateKey(key: CryptoKey): Promise<JsonWebKey> {
  const jwk = await getSubtle().exportKey('jwk', key);
  return jwk;
}

export async function importPrivateKey(jwk: JsonWebKey): Promise<CryptoKey> {
  const key = await getSubtle().importKey(
    'jwk',
    jwk,
    {
      name: ALGORITHM,
      namedCurve: CURVE,
    },
    false,
    ['deriveKey', 'deriveBits']
  );

  return key;
}

export async function deriveSharedSecret(
  privateKey: CryptoKey,
  publicKey: CryptoKey
): Promise<ArrayBuffer> {
  const sharedBits = await getSubtle().deriveBits(
    {
      name: ALGORITHM,
      public: publicKey,
    },
    privateKey,
    256
  );

  return sharedBits;
}

async function deriveEncryptionKey(sharedSecret: ArrayBuffer): Promise<CryptoKey> {
  const keyMaterial = await getSubtle().importKey(
    'raw',
    sharedSecret,
    'HKDF',
    false,
    ['deriveKey']
  );

  const salt = new Uint8Array(16);
  const info = new TextEncoder().encode('aether-encryption-v1');

  const aesKey = await getSubtle().deriveKey(
    {
      name: 'HKDF',
      hash: HASH,
      salt,
      info,
    },
    keyMaterial,
    {
      name: ENCRYPTION,
      length: KEY_LENGTH,
    },
    false,
    ['encrypt', 'decrypt']
  );

  return aesKey;
}

export async function encryptMessage(
  sharedSecret: ArrayBuffer,
  plaintext: ArrayBuffer
): Promise<EncryptedMessage> {
  const aesKey = await deriveEncryptionKey(sharedSecret);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const ciphertext = await getSubtle().encrypt(
    {
      name: ENCRYPTION,
      iv,
    },
    aesKey,
    plaintext
  );

  return { iv, ciphertext };
}

export async function decryptMessage(
  sharedSecret: ArrayBuffer,
  encrypted: EncryptedMessage
): Promise<ArrayBuffer> {
  const aesKey = await deriveEncryptionKey(sharedSecret);

  const ivCopy = new Uint8Array(encrypted.iv);

  const plaintext = await getSubtle().decrypt(
    {
      name: ENCRYPTION,
      iv: ivCopy,
    },
    aesKey,
    encrypted.ciphertext
  );

  return plaintext;
}
