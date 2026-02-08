import type { Meta, StoryObj } from '@storybook/react';
import { YahmanProvider } from './YahmanContext';
declare const meta: Meta<typeof YahmanProvider>;
export default meta;
type Story = StoryObj<typeof YahmanProvider>;
/** Api (REST) + Printer + LogWindow（Escape 5回で表示）。REST は JSONPlaceholder /posts を使用 */
export declare const Default: Story;
/**
 * 本番時のみ認証（auth: true）。
 * storybookSimulateProduction: true で Storybook 内だけ本番扱いし、ログイン画面を表示。
 * 本番ビルド時は NODE_ENV=production で同様にログイン要求。
 */
export declare const WithAuthProductionOnly: Story;
/** GraphQL: useApi().ransack (QUERY) / .handing (MUTATION) → Network */
export declare const GraphQL: Story;
//# sourceMappingURL=YahmanContext.stories.d.ts.map