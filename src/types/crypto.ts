export interface EncryptedMessage {
  iv: Uint8Array;
  ciphertext: ArrayBuffer;
  senderPublicKey?: JsonWebKey;
}

export interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

export interface IdentityKeys {
  publicKey: JsonWebKey;
  privateKey: JsonWebKey;
}
