# Yargram

React 向けのデバッグ・開発用ライブラリ。API 呼び出し（REST / GraphQL）、ログ出力、ログウィンドウを一括で扱います。

> [English](README.en.md)

## 構成

- **@yargram/core** — ログ用 `createPrinter`、API 用 `createApi` などコアユーティリティ
- **@yargram/react** — React 用 Context（`YargramProvider`）、`useApi` / `usePrinter` / `useYargram`、LogWindow コンポーネント

## インストール

```bash
pnpm add @yargram/core @yargram/react
# または
npm install @yargram/core @yargram/react
```

**peerDependencies:** React 18 以上。

## クイックスタート

アプリのルートで `YargramProvider` でラップし、`api` と `logWindow` を渡します。

```tsx
import { YargramProvider, useApi, usePrinter, useYargram } from '@yargram/react';

function App() {
  return (
    <YargramProvider
      api={{ provider: 'rest', baseUrl: 'https://api.example.com' }}
      logWindow={{}}
    >
      <MyContent />
    </YargramProvider>
  );
}

function MyContent() {
  const api = useApi();
  const printer = usePrinter();
  const { openLogWindow } = useYargram();

  const handleFetch = async () => {
    const res = await api.get('/users');
    printer.info(`Status: ${res.status}`);
  };

  return (
    <div>
      <button onClick={handleFetch}>Fetch</button>
      <button onClick={openLogWindow}>ログウィンドウを開く</button>
    </div>
  );
}
```

**Escape キーを 5 回連続で押す**とログウィンドウが開きます（`logWindow={}` を渡している場合）。

---

## 使い方

### YargramProvider

| プロパティ | 説明 |
|-----------|------|
| `api` | **必須.** `{ provider: 'rest', baseUrl?: string }` または `{ provider: 'graphql', uri?: string, client?: ApolloClient }` |
| `printer` | 任意. `{ env?: 'local' \| 'sandbox' \| 'staging' \| 'production' }` |
| `logWindow` | 任意. `{}` を渡すと Escape 5 回でログウィンドウを表示。`{ visibleRows?: number }` で表示行数を指定可能 |
| `auth` | 任意. 本番・ステージングのみパスワード認証する場合に指定（後述） |

#### REST API

```tsx
<YargramProvider
  api={{ provider: 'rest', baseUrl: 'https://api.example.com' }}
  logWindow={{}}
>
  {children}
</YargramProvider>
```

`useApi()` で `get`, `post`, `put`, `delete` が使え、呼び出しは LogWindow の「Networks」タブに記録されます。

#### GraphQL（Apollo Client）

```tsx
<YargramProvider
  api={{ provider: 'graphql', uri: 'https://api.example.com/graphql' }}
  logWindow={{}}
>
  {children}
</YargramProvider>
```

`useApi()` で `ransack`（QUERY）と `handing`（MUTATION）が使え、同様に Networks に記録されます。

---

### useApi

`YargramProvider` の子コンポーネント内で使用します。

**REST の場合:**

```tsx
const api = useApi();
if (api.provider === 'rest') {
  await api.get('/users');
  await api.post('/users', { name: 'Alice' });
  await api.put('/users/1', { name: 'Bob' });
  await api.delete('/users/1');
}
```

**GraphQL の場合:**

```tsx
import { gql } from '@apollo/client';

const api = useApi();
if (api.provider === 'graphql') {
  const result = await api.ransack({
    query: gql`query GetUser { user(id: "1") { id name } }`,
  });
  await api.handing({
    mutation: gql`mutation UpdateName { updateUser(id: "1", name: "x") { id } }`,
  });
}
```

---

### usePrinter

`info` / `warn` / `error` でログを出し、内容は LogWindow の「Logs」タブに表示されます。文字列のほか、オブジェクトや配列を渡すとアコーディオンで展開表示されます。

```tsx
const printer = usePrinter();
printer.info('処理を開始しました');
printer.warn('キャッシュが古いです');
printer.error('リクエストに失敗しました');
printer.info({ user: 'Alice', count: 42 });  // オブジェクトはアコーディオン表示
```

---

### useYargram

ログウィンドウの開閉とエントリ取得に使います。

```tsx
const {
  openLogWindow,
  closeLogWindow,
  isLogWindowOpen,
  logEntries,
  networkEntries,
  addLogEntry,
  addNetworkEntry,
} = useYargram();
```

- `openLogWindow()` — ログウィンドウを開く
- `closeLogWindow()` — ログウィンドウを閉じる
- `logEntries` / `networkEntries` — 表示用のログ・ネットワーク一覧（通常は `usePrinter` / `useApi` 連携で自動追加）

---

### 認証（本番・ステージングのみ）

`auth` を渡すと、**NODE_ENV が `production` または `staging` のときだけ** LogWindow を開いた際にパスワード入力が求められます。開発時は認証なしで LogWindow が使えます。

```tsx
<YargramProvider
  api={{ provider: 'rest', baseUrl: 'https://api.example.com' }}
  logWindow={{}}
  auth={{
    loginTitle: 'Sign in',
    passwordHash: 'YOUR_SHA256_HEX',  // 任意。未指定時は env またはデフォルト
    tokenTtlMs: 7 * 24 * 60 * 60 * 1000,  // 7日。任意
  }}
>
  {children}
</YargramProvider>
```

- **デフォルトパスワード:** `12345678`（SHA-256 で検証）
- **環境変数で上書き:**  
  `YAHMAN_LOGIN_PASSWORD_HASH` または `VITE_YAHMAN_LOGIN_PASSWORD_HASH` に、希望するパスワードの SHA-256（hex）を設定
- **ログイン後:** localStorage にトークン（ドメイン・有効期限付き）を保存し、同一ドメイン・期限内はログインをスキップ

Storybook で本番相当の認証を試す場合は `auth={{ storybookSimulateProduction: true }}` を指定します。

---

## 環境変数

| 変数 | 説明 |
|------|------|
| `ENDPOINT_URL` | REST の baseUrl 未指定時のフォールバック（core） |
| `YAHMAN_LOGIN_PASSWORD_HASH` | Yargram ログウィンドウ認証用パスワードの SHA-256（hex） |
| `VITE_YAHMAN_LOGIN_PASSWORD_HASH` | 上記の Vite 向け |

---

## スクリプト（モノレポ）

```bash
pnpm install
pnpm --filter @yargram/react build
pnpm --filter @yargram/react test
pnpm --filter @yargram/react storybook
```

---

## ライセンス

ISC
