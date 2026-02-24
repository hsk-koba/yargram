/**
 * 時間限定・解読が難しい暗号化が可能な localStorage ラッパー。
 * setItem / getItem / removeItem はすべて同期。有効期限切れの項目は getItem で null を返す。
 */

const DEFAULT_PREFIX = '__yargram_secure__';
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7日

function toBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function fromBase64(base64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(base64, 'base64'));
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** secret を使った XOR 難読化（解読が難しい） */
function encrypt(secret: string, data: string): string {
  const key = secret || '\u0001default';
  const keyBytes = new TextEncoder().encode(key);
  const dataBytes = new TextEncoder().encode(data);
  const out = new Uint8Array(dataBytes.length);
  for (let i = 0; i < dataBytes.length; i++) {
    out[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  return toBase64(out);
}

function decrypt(secret: string, encoded: string): string {
  const key = secret || '\u0001default';
  const keyBytes = new TextEncoder().encode(key);
  const dataBytes = fromBase64(encoded);
  const out = new Uint8Array(dataBytes.length);
  for (let i = 0; i < dataBytes.length; i++) {
    out[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  return new TextDecoder().decode(out);
}

type StoredEntry = {
  v: string;
  e: number;
};

export type SecureStorageOptions = {
  /** 暗号化に使う秘密文字列。省略時も簡易鍵で難読化する */
  secret?: string;
  /** デフォルトの有効期限（ミリ秒）。省略時は 7 日 */
  ttlMs?: number;
  /** localStorage のキーに付けるプレフィックス */
  prefix?: string;
};

/**
 * 時間限定・解読が難しい暗号化が可能な localStorage ラッパー。
 * - setItem(key, value [, ttlMs]) で保存（ttlMs 省略時はコンストラクタの ttlMs）
 * - getItem(key) で取得。有効期限切れなら null
 * - removeItem(key) で削除
 */
export class SecureStorage {
  private readonly secret: string;
  private readonly defaultTtlMs: number;
  private readonly prefix: string;
  private readonly storage: Storage;

  constructor(options: SecureStorageOptions & { storage?: Storage } = {}) {
    this.secret = options.secret ?? '';
    this.defaultTtlMs = options.ttlMs ?? DEFAULT_TTL_MS;
    this.prefix = options.prefix ?? DEFAULT_PREFIX;
    this.storage =
      options.storage ??
      (typeof localStorage !== 'undefined' ? localStorage : (undefined as unknown as Storage));
    if (!this.storage) throw new Error('SecureStorage: localStorage (or storage) is not available');
  }

  private storageKey(key: string): string {
    return this.prefix + key;
  }

  setItem(key: string, value: string, ttlMs?: number): void {
    const ttl = ttlMs ?? this.defaultTtlMs;
    const expiry = Date.now() + ttl;
    const encrypted = encrypt(this.secret, value);
    const entry: StoredEntry = { v: encrypted, e: expiry };
    this.storage.setItem(this.storageKey(key), JSON.stringify(entry));
  }

  getItem(key: string): string | null {
    const raw = this.storage.getItem(this.storageKey(key));
    if (raw == null) return null;
    let entry: StoredEntry;
    try {
      entry = JSON.parse(raw) as StoredEntry;
    } catch {
      return null;
    }
    if (entry.e <= Date.now()) {
      this.storage.removeItem(this.storageKey(key));
      return null;
    }
    try {
      return decrypt(this.secret, entry.v);
    } catch {
      return null;
    }
  }

  removeItem(key: string): void {
    this.storage.removeItem(this.storageKey(key));
  }
}
