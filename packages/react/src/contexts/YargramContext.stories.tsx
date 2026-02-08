import type { Meta, StoryObj } from '@storybook/react';
import { gql } from '@apollo/client';
import { YargramProvider, useYargram } from './YargramContext';
import { usePrinter } from './PrinterContext';
import { useApi } from './ApiContext';

function DemoContent() {
  const { openLogWindow } = useYargram();
  const printer = usePrinter();
  const api = useApi();

  const addInfo = () => printer.info('Info from usePrinter');
  const addWarn = () => printer.warn('Warn from usePrinter');
  const addError = () => printer.error('Error from usePrinter');

  if (api.provider === 'rest') {
    return (
      <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
        <h3>YargramProvider デモ (REST)</h3>
        <p>Escape キーを 5 回押すとログウィンドウが開きます。</p>
        <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
          usePrinter().info / warn / error → Log タブ。useApi().get / post / put / delete → Network タブに反映。
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
          <button type="button" onClick={addInfo}>Log: Info</button>
          <button type="button" onClick={addWarn}>Log: Warn</button>
          <button type="button" onClick={addError}>Log: Error</button>
          <button type="button" onClick={() => api.get('/posts').then((res) => printer.info(`Response: ${res.status} ${res.statusText}`)).catch((err) => printer.error(`Error: ${err.message}`))}>
            Network: GET /posts
          </button>
          <button
            type="button"
            onClick={() =>
              api
                .post('/posts', { title: 'Storybook post', body: 'Body from demo', userId: 1 })
                .then((res) => printer.info(`Response: ${res.status} ${res.statusText}`))
                .catch((err) => printer.error(`Error: ${err.message}`))
            }
          >
            Network: POST /posts
          </button>
          <button
            type="button"
            onClick={() =>
              api
                .put('/posts/1', { id: 1, title: 'Updated title', body: 'Updated body', userId: 1 })
                .then((res) => printer.info(`Response: ${res.status} ${res.statusText}`))
                .catch((err) => printer.error(`Error: ${err.message}`))
            }
          >
            Network: PUT /posts/1
          </button>
          <button type="button" onClick={() => api.delete('/posts/1').then((res) => printer.info(`Response: ${res.status} ${res.statusText}`)).catch(() => {})}>
            Network: DELETE /posts/1
          </button>
          <button type="button" onClick={openLogWindow}>ログウィンドウを開く</button>
        </div>
      </div>
    );
  }

  const runQuery = () => {
    api
      .ransack({
        query: gql`
          query GetUser { user(id: "1") { id name } }
        `,
      })
      .catch((err) => printer.error(`Error: ${err.message}`));
  };
  const runMutation = () => {
    api
      .handing({
        mutation: gql`
          mutation UpdateUser { updateUser(id: "1", name: "x") { id name } }
        `,
      })
      .catch((err) => printer.error(`Error: ${err.message}`));
  };

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h3>YargramProvider デモ (GraphQL)</h3>
      <p>useApi().ransack (QUERY) / .handing (MUTATION) で Network タブに反映。</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
        <button type="button" onClick={addInfo}>Log: Info</button>
        <button type="button" onClick={runQuery}>Network: ransack (QUERY)</button>
        <button type="button" onClick={runMutation}>Network: handing (MUTATION)</button>
        <button type="button" onClick={openLogWindow}>ログウィンドウを開く</button>
      </div>
    </div>
  );
}

const meta: Meta<typeof YargramProvider> = {
  title: 'Contexts/YargramProvider',
  component: YargramProvider,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof YargramProvider>;

/** Api (REST) + Printer + LogWindow（Escape 5回で表示）。REST は JSONPlaceholder /posts を使用 */
export const Default: Story = {
  render: () => (
    <YargramProvider
      api={{ provider: 'rest', baseUrl: 'https://jsonplaceholder.typicode.com' }}
      printer={{ env: 'local' }}
      logWindow={{}}
    >
      <DemoContent />
    </YargramProvider>
  ),
};

/**
 * 本番時のみ認証（auth: true）。
 * storybookSimulateProduction: true で Storybook 内だけ本番扱いし、ログイン画面を表示。
 * 本番ビルド時は NODE_ENV=production で同様にログイン要求。
 */
export const WithAuthProductionOnly: Story = {
  render: () => (
    <YargramProvider
      api={{ provider: 'rest', baseUrl: 'https://jsonplaceholder.typicode.com' }}
      printer={{ env: 'local' }}
      logWindow={{}}
      auth={{ storybookSimulateProduction: true }}
    >
      <DemoContent />
    </YargramProvider>
  ),
};

/** GraphQL: useApi().ransack (QUERY) / .handing (MUTATION) → Network */
export const GraphQL: Story = {
  render: () => (
    <YargramProvider
      api={{ provider: 'graphql', uri: 'https://api.example.com/graphql' }}
      printer={{ env: 'local' }}
      logWindow={{}}
    >
      <DemoContent />
    </YargramProvider>
  ),
};
