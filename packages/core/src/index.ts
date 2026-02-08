export type Env = 'local' | 'sandbox' | 'staging' | 'production';

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