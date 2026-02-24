export type Env = 'local' | 'sandbox' | 'staging' | 'production';
import gql from 'graphql-tag';

type DocumentNode = ReturnType<typeof gql>;

function getEnvEndpoint(): string | undefined {
  if (typeof process === 'undefined' || !process.env) return undefined;
  return process.env.ENDPOINT_URL;
}

const API_ENDPOINT = getEnvEndpoint();

export const createPrinter = (env: Env) => {
  const isDebug = env === 'local' || env === 'sandbox';
  return {
    info: (msg: string) => {
      if (isDebug) console.log(`%c[INFO] ${msg}`, "color: skyblue");
      // ここで共通のログ保持ロジックを呼ぶ
    },
    warn: (msg: string) => {
      if (isDebug) console.warn(`[WARN] ${msg}`);
    },
    error: (msg: string) => {
      console.error(`[ERROR] ${msg}`);
    }
  };
};

export const createApi = () => {
  const base = API_ENDPOINT ?? '';
  return (path: string) => fetch(`${base}${path}`);
};

/**
 * GraphQL クエリと 1 つ以上の Fragment を 1 つのドキュメントに結合する。
 * クエリ内で `...FragmentName` を参照している場合、対応する fragment 定義を渡す。
 *
 * @param query - オペレーション（query / mutation など）の文字列
 * @param fragments - fragment 定義の文字列（複数可）。例: `fragment UserFields on User { id name }`
 * @returns 結合された GraphQL ドキュメント
 */
export function mergeFragmentGql(query: string, ...fragments: string[]): DocumentNode {
  const q = query.trim();
  const parts = fragments.map((f) => f.trim()).filter(Boolean);
  if (parts.length === 0) return gql`${q}`;
  if (!q) return gql`${parts.join('\n\n')}`;
  return gql`${q}\n\n${parts.join('\n\n')}`;
}

export { SecureStorage } from './SecureStorage';
export type { SecureStorageOptions } from './SecureStorage';