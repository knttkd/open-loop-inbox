# MCP UI capability experiment

`show_open_loop_actions`が3件のサンプルActionを返し、MCP Apps対応ホストではカードUIを表示する実験です。v3ではチャット内を起動ボタンだけに抑え、CodexのサイドバーでActionカードを操作します。

## 安全境界

- 実履歴は読みません。
- Actionを実行・保存しません。
- Toolは読取専用です。
- UI非対応ホストでも、同じAction一覧をテキストと`structuredContent`で確認できます。

## 自動検証

リポジトリルートで次を実行します。

```sh
node --test tests/plugin.test.mjs
```

このテストはSTDIOでMCPサーバーを起動し、初期化、Tool一覧、Resource読取、Tool実行を検証します。

## Codexでの実機検証

1. リポジトリルートで、ローカルMarketplaceからPluginを再インストールします。

   ```sh
   codex plugin remove open-loop-inbox@open-loop-inbox-local
   codex plugin add open-loop-inbox@open-loop-inbox-local
   ```

2. Codexを再起動し、新しいタスクを作成します。
3. MCPサーバー一覧で`open-loop-inbox-ui`が有効であることを確認します。
4. 「`show_open_loop_actions`を呼び出してMCP UI実験を表示して」と依頼します。
5. チャット内には「サイドバーで開く」ボタンだけが表示されることを確認します。
6. 「サイドバーで開く」を押し、Actionカードが右サイドバーへ表示されることを確認します。
7. Evidenceを開閉し、表示領域の高さが内容に追従するか確認します。
8. 「チャットに戻す」を押し、サイドバーが閉じてチャット内の起動ボタンへ戻ることを確認します。

カードUIが表示されなくてもTool呼出しが成功し、3件のActionがテキストで表示されれば、MCP接続とFallbackは成功です。UI表示可否はホスト能力の検証結果として別に扱います。

既存タスクでは更新したMCP設定が反映されない場合があるため、必ず新しいタスクで確認します。MCP Apps機能が無効な環境では機能を有効化してCodexを再起動します。

Codex CLIではTool呼出しとテキストFallbackを検証できますが、iframeの描画確認はできません。カードの表示確認はCodexデスクトップアプリで行います。

MCP Apps内部では`fullscreen`表示を要求しますが、現在のCodexデスクトップアプリでは右サイドバーとして表示されます。利用者向けUIでは内部モード名を使わず「サイドバー」と表現します。Codexが要求を拒否した場合は、チャット内の起動ボタンを維持して再試行できる状態にします。
