import type { Meta, StoryObj } from '@storybook/react';
import { LogWindow } from './LogWindow';
declare const meta: Meta<typeof LogWindow>;
export default meta;
type Story = StoryObj<typeof LogWindow>;
export declare const Default: Story;
export declare const InfoOnly: Story;
export declare const ManyEntries: Story;
export declare const Empty: Story;
export declare const NetworksTab: Story;
/** Networks タブで REST API リクエストを表示 */
export declare const NetworkREST: Story;
/** Networks タブで GraphQL リクエストを表示 */
export declare const NetworkGraphQL: Story;
/** REST と GraphQL の両方のネットワークエントリを表示 */
export declare const NetworkMixed: Story;
/**
 * ヘッダーをドラッグしてウィンドウを自由に移動できます。
 * タブ（Logs / Networks）をクリックしてもドラッグは開始されません。
 */
export declare const Draggable: Story;
/**
 * Escape キーを 5 回押すとログウィンドウがオーバーレイで開きます。
 * テスト手順: ストーリーを開き、Escape を 5 回連続で押す（約 1.5 秒以内に次のキーを押す）。
 * ログウィンドウ表示中に Escape を 1 回押すか、背景をクリックすると閉じます。
 * 開いたウィンドウはヘッダーをドラッグして移動できます。
 */
export declare const EscapeToOpen: Story;
//# sourceMappingURL=LogWindow.stories.d.ts.map