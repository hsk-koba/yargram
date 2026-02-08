import type { Meta, StoryObj } from '@storybook/react';
import { LogWindow } from './LogWindow';
import { LogWindowEscapeDemo } from './LogWindowEscapeDemo';
import type { LogEntry, NetworkEntryRest, NetworkEntryGraphql } from './types';

const sampleEntries: LogEntry[] = [
  {
    id: '1',
    level: 'info',
    message: 'Hello!!',
    source: 'ArticleContainer.tsx:32',
  },
  {
    id: '2',
    level: 'warn',
    message: 'Hello!!',
    source: 'ArticleContainer.tsx:32',
  },
  {
    id: '3',
    level: 'error',
    message: 'Hello!!',
    source: 'ArticleContainer.tsx:32',
  },
];

const sampleNetworkRest: NetworkEntryRest[] = [
  {
    id: 'r1',
    type: 'rest',
    method: 'GET',
    url: '/api/users',
    status: 200,
    statusText: 'OK',
    request: 'GET /api/users HTTP/1.1\nAccept: application/json',
    response: '{\n  "data": [\n    { "id": "1", "name": "Alice" },\n    { "id": "2", "name": "Bob" }\n  ]\n}',
  },
  {
    id: 'r2',
    type: 'rest',
    method: 'POST',
    url: '/api/auth/login',
    status: 201,
    statusText: 'Created',
    request: 'POST /api/auth/login HTTP/1.1\nContent-Type: application/json\n\n{"email":"user@example.com","password":"***"}',
    response: '{\n  "token": "eyJhbGciOiJIUzI1NiIs...",\n  "user": { "id": "1", "email": "user@example.com" }\n}',
  },
  {
    id: 'r3',
    type: 'rest',
    method: 'GET',
    url: '/api/articles/123',
    status: 404,
    statusText: 'Not Found',
    request: 'GET /api/articles/123 HTTP/1.1',
    response: '{\n  "error": "Not Found",\n  "message": "Article 123 does not exist"\n}',
  },
];

const sampleNetworkGraphql: NetworkEntryGraphql[] = [
  {
    id: 'g1',
    type: 'graphql',
    operationName: 'GetUser',
    url: '/graphql',
    status: 200,
    statusText: 'OK',
    request: 'query GetUser($id: ID!) {\n  user(id: $id) {\n    id\n    name\n    email\n  }\n}\n\nVariables: { "id": "1" }',
    response: '{\n  "data": {\n    "user": {\n      "id": "1",\n      "name": "Alice",\n      "email": "alice@example.com"\n    }\n  }\n}',
  },
  {
    id: 'g2',
    type: 'graphql',
    operationName: 'ListArticles',
    url: '/graphql',
    status: 200,
    statusText: 'OK',
    request: 'query ListArticles {\n  articles {\n    id\n    title\n    publishedAt\n  }\n}',
    response: '{\n  "data": {\n    "articles": [\n      { "id": "1", "title": "Hello", "publishedAt": "2024-01-01" }\n    ]\n  }\n}',
  },
  {
    id: 'g3',
    type: 'graphql',
    operationName: 'CreatePost',
    url: '/graphql',
    status: 400,
    statusText: 'Bad Request',
    request: 'mutation CreatePost($input: CreatePostInput!) {\n  createPost(input: $input) { id }\n}',
    response: '{\n  "errors": [\n    { "message": "Validation error: title is required" }\n  ]\n}',
  },
];

const meta: Meta<typeof LogWindow> = {
  title: 'Components/LogWindow',
  component: LogWindow,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    defaultTab: {
      control: 'radio',
      options: ['logs', 'networks'],
    },
  },
};

export default meta;

type Story = StoryObj<typeof LogWindow>;

export const Default: Story = {
  args: {
    entries: sampleEntries,
    defaultTab: 'logs',
  },
};

export const InfoOnly: Story = {
  args: {
    entries: [
      { id: '1', level: 'info', message: 'Application started', source: 'App.tsx:12' },
      { id: '2', level: 'info', message: 'User logged in', source: 'Auth.tsx:45' },
    ],
  },
};

export const ManyEntries: Story = {
  args: {
    entries: [
      ...sampleEntries,
      { id: '4', level: 'info', message: 'Fetching data...', source: 'useApi.ts:18' },
      { id: '5', level: 'warn', message: 'Deprecated API used', source: 'legacy.ts:3' },
      { id: '6', level: 'error', message: 'Network request failed', source: 'api.ts:92' },
    ],
    height: 280,
  },
};

/** 表示行数を 2 行に固定。スクロールで続きを表示 */
export const VisibleRows2: Story = {
  args: {
    entries: [
      ...sampleEntries,
      { id: '4', level: 'info', message: 'Fetching data...', source: 'useApi.ts:18' },
      { id: '5', level: 'warn', message: 'Deprecated API used', source: 'legacy.ts:3' },
    ],
    visibleRows: 2,
  },
};

/** 表示行数を 3 行に固定 */
export const VisibleRows3: Story = {
  args: {
    entries: [
      ...sampleEntries,
      { id: '4', level: 'info', message: 'Fetching data...', source: 'useApi.ts:18' },
    ],
    visibleRows: 3,
  },
};

/** 表示行数を任意の数（例: 5 行）に指定 */
export const VisibleRows5: Story = {
  args: {
    entries: [
      ...sampleEntries,
      { id: '4', level: 'info', message: 'Fetching data...', source: 'useApi.ts:18' },
      { id: '5', level: 'warn', message: 'Deprecated API used', source: 'legacy.ts:3' },
      { id: '6', level: 'error', message: 'Network request failed', source: 'api.ts:92' },
    ],
    visibleRows: 5,
  },
};

export const Empty: Story = {
  args: {
    entries: [],
  },
};

/** 連想配列・配列はアコーディオンで展開・縮小表示 */
export const ObjectAndArrayMessages: Story = {
  args: {
    entries: [
      { id: '1', level: 'info', message: 'Plain string message', source: 'App.tsx:1' },
      {
        id: '2',
        level: 'info',
        message: { name: 'Alice', age: 30, tags: ['admin', 'user'] },
        source: 'App.tsx:2',
      },
      {
        id: '3',
        level: 'warn',
        message: [{ id: 1, title: 'First' }, { id: 2, title: 'Second' }],
        source: 'App.tsx:3',
      },
    ],
  },
};

export const NetworksTab: Story = {
  args: {
    entries: sampleEntries,
    defaultTab: 'networks',
  },
};

/** Networks タブで REST API リクエストを表示 */
export const NetworkREST: Story = {
  args: {
    networkEntries: sampleNetworkRest,
    defaultTab: 'networks',
  },
};

/** Networks タブで GraphQL リクエストを表示 */
export const NetworkGraphQL: Story = {
  args: {
    networkEntries: sampleNetworkGraphql,
    defaultTab: 'networks',
  },
};

/** REST と GraphQL の両方のネットワークエントリを表示 */
export const NetworkMixed: Story = {
  args: {
    networkEntries: [
      ...sampleNetworkRest,
      ...sampleNetworkGraphql,
    ],
    defaultTab: 'networks',
  },
};

/**
 * ヘッダーをドラッグしてウィンドウを自由に移動できます。
 * タブ（Logs / Networks）をクリックしてもドラッグは開始されません。
 */
export const Draggable: Story = {
  args: {
    entries: sampleEntries,
    networkEntries: [...sampleNetworkRest, ...sampleNetworkGraphql],
    draggable: true,
    defaultPosition: { x: 80, y: 80 },
  },
};

/**
 * Escape キーを 5 回押すとログウィンドウがオーバーレイで開きます。
 * テスト手順: ストーリーを開き、Escape を 5 回連続で押す（約 1.5 秒以内に次のキーを押す）。
 * ログウィンドウ表示中に Escape を 1 回押すか、背景をクリックすると閉じます。
 * 開いたウィンドウはヘッダーをドラッグして移動できます。
 */
export const EscapeToOpen: Story = {
  render: () => (
    <LogWindowEscapeDemo
      entries={sampleEntries}
      networkEntries={[...sampleNetworkRest, ...sampleNetworkGraphql]}
    />
  ),
};
