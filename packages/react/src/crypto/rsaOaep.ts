function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '');

  if (!b64) {
    throw new Error('Invalid PEM: no base64 content found.');
  }

  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const b64 = base64.replace(/\s+/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const keyData = pemToArrayBuffer(pem);

  try {
    return await crypto.subtle.importKey(
      'pkcs8',
      keyData,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['decrypt']
    );
  } catch {
    throw new Error(
      'Failed to import private key. Ensure it is PKCS#8 PEM (BEGIN PRIVATE KEY) and RSA-OAEP(SHA-256) compatible.'
    );
  }
}

export async function decryptData(privateKey: CryptoKey, encryptedData: ArrayBuffer): Promise<ArrayBuffer> {
  try {
    return await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, encryptedData);
  } catch {
    throw new Error(
      'Decryption failed. The private key may be incorrect or the data is not valid RSA-OAEP ciphertext.'
    );
  }
}

export async function decryptText(privateKey: CryptoKey, encryptedData: ArrayBuffer): Promise<string> {
  const buf = await decryptData(privateKey, encryptedData);
  return new TextDecoder().decode(buf);
}
