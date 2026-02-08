# Yargram

A debugging and development library for React. It provides a unified way to handle API calls (REST / GraphQL), log output, and a log window.

> [日本語](README.md)

## Structure

- **@yargram/core** — Core utilities: `createPrinter` for logging, `createApi` for API, etc.
- **@yargram/react** — React Context (`YargramProvider`), hooks `useApi` / `usePrinter` / `useYargram`, and the LogWindow component

## Installation

```bash
pnpm add @yargram/core @yargram/react
# or
npm install @yargram/core @yargram/react
```

**Peer dependencies:** React 18 or later.

## Quick start

Wrap your app root with `YargramProvider` and pass `api` and `logWindow`:

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
      <button onClick={openLogWindow}>Open log window</button>
    </div>
  );
}
```

**Press the Escape key 5 times in a row** to open the log window (when `logWindow={}` is passed).

---

## Usage

### YargramProvider

| Prop | Description |
|------|-------------|
| `api` | **Required.** `{ provider: 'rest', baseUrl?: string }` or `{ provider: 'graphql', uri?: string, client?: ApolloClient }` |
| `printer` | Optional. `{ env?: 'local' \| 'sandbox' \| 'staging' \| 'production' }` |
| `logWindow` | Optional. Pass `{}` to enable the log window (Escape × 5 to open). Use `{ visibleRows?: number }` to set the visible row count. |
| `auth` | Optional. Password authentication for production/staging only (see below) |

#### REST API

```tsx
<YargramProvider
  api={{ provider: 'rest', baseUrl: 'https://api.example.com' }}
  logWindow={{}}
>
  {children}
</YargramProvider>
```

`useApi()` exposes `get`, `post`, `put`, and `delete`; calls are recorded in the LogWindow “Networks” tab.

#### GraphQL (Apollo Client)

```tsx
<YargramProvider
  api={{ provider: 'graphql', uri: 'https://api.example.com/graphql' }}
  logWindow={{}}
>
  {children}
</YargramProvider>
```

`useApi()` exposes `ransack` (QUERY) and `handing` (MUTATION); they are also recorded in the Networks tab.

---

### useApi

Use inside a component that is a child of `YargramProvider`.

**REST:**

```tsx
const api = useApi();
if (api.provider === 'rest') {
  await api.get('/users');
  await api.post('/users', { name: 'Alice' });
  await api.put('/users/1', { name: 'Bob' });
  await api.delete('/users/1');
}
```

**GraphQL:**

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

Use `info`, `warn`, and `error` to log; messages appear in the LogWindow “Logs” tab. You can pass strings, or objects/arrays for accordion-style expandable display.

```tsx
const printer = usePrinter();
printer.info('Processing started');
printer.warn('Cache is stale');
printer.error('Request failed');
printer.info({ user: 'Alice', count: 42 });  // Objects shown in accordion
```

---

### Authentication (production / staging only)

When `auth` is passed, **only when NODE_ENV is `production` or `staging`** will opening the LogWindow require a password. In development, the log window works without authentication.

```tsx
<YargramProvider
  api={{ provider: 'rest', baseUrl: 'https://api.example.com' }}
  logWindow={{}}
  auth={{
    loginTitle: 'Sign in',
    passwordHash: 'YOUR_SHA256_HEX',  // Optional. Falls back to env or default
    tokenTtlMs: 7 * 24 * 60 * 60 * 1000,  // 7 days. Optional
  }}
>
  {children}
</YargramProvider>
```

- **Default password:** `12345678` (verified with SHA-256)
- **Override via env:** Set `YAHMAN_LOGIN_PASSWORD_HASH` or `VITE_YAHMAN_LOGIN_PASSWORD_HASH` to the SHA-256 (hex) of your desired password
- **After login:** A token (with domain and expiry) is stored in localStorage; login is skipped on the same domain within the validity period

To try production-like auth in Storybook, use `auth={{ storybookSimulateProduction: true }}`.

---

## Environment variables

| Variable | Description |
|----------|-------------|
| `ENDPOINT_URL` | Fallback when REST `baseUrl` is not set (core) |
| `YAHMAN_LOGIN_PASSWORD_HASH` | SHA-256 (hex) of the password for Yargram log-window auth |
| `VITE_YAHMAN_LOGIN_PASSWORD_HASH` | Same as above for Vite |

---

## Scripts (monorepo)

```bash
pnpm install
pnpm --filter @yargram/react build
pnpm --filter @yargram/react test
pnpm --filter @yargram/react storybook
```

---

## License

ISC
