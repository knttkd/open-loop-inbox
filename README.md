# Open Loop Inbox

> 人とAIとの会話に散らばった「やり残し」を、一つの実行キューへ。

Open Loop Inboxは、会議、ChatGPT、Codexに残った未完了の約束や作業を回収し、重複・完了・不足情報を照合したうえで、今判断すべき少数のActionだけを提示するプロトタイプです。

## デモサイト

デモサイトはCodex Sitesへ限定公開しています。

公開スラッグは`open-loop-inbox`です。

デモはサンプルデータだけを使用します。

共有用のOG画像とデプロイ用サムネイルは設定していません。

## Problem

未完了の作業はToDoアプリだけに存在しません。会議で話した依頼、ChatGPTで調べたいと話したテーマ、Codexへ頼んだ実装など、複数の会話に分散しています。

単純にActionを抽出すると、同じ依頼が重複し、後の会話ですでに完了した作業まで再び表示されます。結果として、整理用のInbox自体が新しい仕事になります。

## Solution

Open Loop Inboxは、次の4段階を一つの体験として閉じます。

1. **Recover**：複数ソースからOpen Loop候補を回収する
2. **Reconcile**：重複、完了済み、更新、不足情報を照合する
3. **Decide**：根拠と影響を見て、承認・却下・編集する
4. **Execute**：承認された内容だけを実行し、Receiptを残す

サンプルでは、5会話から見つかった7候補を、重複2件・完了1件・低確度1件の処理によって3件のレビューへ減らします。

## 30秒で試す

1. トップ画面で「サンプルの1日を試す」を選択する
2. 5つのサンプル会話が解析されるのを待つ
3. Actionカードを右・左・上へスワイプするか、カード下のボタンを使う
4. 3件を処理し、Action Receiptを確認する

スワイプできない環境では、ボタンとキーボードの左右・上矢印、Enterを利用できます。

## 現在実装されている範囲

- 認証不要のJudge Sandbox
- 会議、ChatGPT、Codexを模した5ソース
- 7候補から3レビューへの決定論的Fallback分析
- クロスソース重複統合
- Codex完了証拠による完了済み除外
- Evidence、Confidence、Risk、実行Preview
- スワイプ、ボタン、キーボード操作
- 不足情報を一問だけ確認するフロー
- Demo Research、Demo Calendar、Demo Gmailのモック実行
- 判断・実行Receipt、Undo、Reset
- セッション中の状態保持
- Reduced Motionとモバイル表示への対応
- Codex PluginとOpen Loop検出Skill
- Codex App Serverによる実スレッドの一覧・読取Connector
- ローカルReceipt Store
- チャット内ランチャーから右サイドバーへActionカードを開くMCP Apps UI実験
- Workspaceを限定してローカル履歴へ接続するCompanion Site

## Architecture

- **Judge Site**：サンプル解析、Action Deck、Demo Executor、Receiptを提供
- **Shared Action Core**：Candidateのグループ化、Evidence強度、完了判定、Proposal生成を担当
- **Golden Sample**：本番デモと自動テストで同じ7候補を使用
- **Session Receipt Store**：ブラウザセッション中の判断・実行履歴を保持
- **Codex Plugin Mode**：実履歴取得、照合手順、承認境界、ローカルReceipt Storeを提供

Judge SiteのFallbackは外部APIへ依存しません。デモ中にモデルや外部サービスで障害が発生しても、価値の中心である照合・判断・Receiptを完走できます。

## Why Codex

完成形ではCodexを、開発に使うツールだけでなく次の役割で利用します。

- 過去のCodexスレッドを読む情報源
- 会議・ChatGPT・Codex間を照合する推論主体
- 実行計画を作るPlanner
- Researchやコード変更を進めるExecutor
- 完了証拠とReceiptを残す監査主体

Judge SandboxではCodex会話とExecutorを安全なサンプルとして再現します。Plugin Modeでは、ローカルのCodex App Serverへ接続し、対象ディレクトリと件数を絞って実履歴を取得できます。

## Try in Codex

Plugin本体は `plugins/open-loop-inbox` にあります。

- サンプルモードでは、外部データなしで「7候補 → 3レビュー」を再現します。
- ライブモードの次版では、起動時に固定Workspace内の限定されたスレッドを自動取得・読込します。ブラウザでの確認操作は不要にします。
- 実行前にはAction、実行先、影響を提示し、明示承認を要求します。
- Receiptは対象Workspaceのローカル領域へ保存でき、次回の完了証拠として利用します。

PluginとSkillの構成は次のコマンドで検証できます。

```bash
python3 ~/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py plugins/open-loop-inbox
python3 ~/.codex/skills/.system/skill-creator/scripts/quick_validate.py plugins/open-loop-inbox/skills/open-loop-inbox
```

## Codex MCP UI実験

MCP Apps対応ホストでは、チャット内に「サイドバーで開く」ボタンだけを表示し、`show_open_loop_actions`が返す3件のサンプルActionを右サイドバーで操作します。UI非対応ホストでは同じ内容をテキストで返すため、MCP接続と画面描画を分けて検証できます。

Pluginを再インストールしてCodexを再起動し、新しいタスクで次のように依頼します。

```text
Use $open-loop-inbox. open-loop-inbox-ui の show_open_loop_actions を呼び出して、MCP UI実験を表示して。
```

Codex CLIではTool呼出しとテキストFallbackまで確認できます。右サイドバー表示とカード操作はCodexデスクトップアプリで確認します。

## Local Companion

Companionは公開Webサービスではなく、各利用者のPCで動くローカルサイトです。Node.js、Codex CLI、Codexへのログイン状態があれば、このリポジトリをcloneして再現できます。

```bash
cd companion
npm start -- --workspace /absolute/path/to/project
```

ブラウザで`http://127.0.0.1:4317`を開きます。サーバーはloopbackにだけbindし、起動時に指定したWorkspace以外の履歴を対象にしません。自動読込は次版で提供予定です。

## Safety

- Judge Sandboxは架空のデータだけを使用します。
- Demo Executorは外部システムへ書き込みません。
- メールは「下書き」、カレンダーは「自分用仮予定」として扱います。
- メール送信、外部招待、購入、公開投稿、削除は実行しません。
- Actionごとに実行先と影響を承認前に表示します。
- 原文にない日時や宛先は推定せず、Needs inputとして確認します。

## Evaluation

自動テストでは、要件書のGolden pathに対して次を検証しています。

- 7候補が3レビューまで減る
- 重複したResearchのEvidenceが失われない
- 後の明示的な条件がProposalへ採用される
- 原文にない予定日時を生成せず、Needs inputになる
- 本番相当のサーバー描画でトップ画面が成立する

## Local development

Node.js 22.13以上を使用します。

```bash
npm install
npm run dev
```

本番ビルドと自動テストは次のコマンドで確認できます。

```bash
npm test
npm run lint
npx tsc --noEmit
```

## Known limitations

- 現段階のJudge Sandboxは事前定義したFallback分析を使用します。
- Live履歴からのAction抽出・照合はCodex Skillの推論で行い、Judge Siteの決定論的Fallbackとはまだ自動同期していません。
- Gmail、Calendarは外部サービスではなくDemo Executorです。
- ChatGPT全履歴の無制限な自動取得は対象外です。自動読込は固定Workspace、非アーカイブ、件数・本文サイズ上限の範囲に限定します。
- 長期的なReceipt永続化と個人最適化は未実装です。
- Codexデスクトップでは`fullscreen`要求が右サイドバー表示になることを確認済みです。他のMCP Appsホストでは表示位置が異なる可能性があります。
- Companionは履歴Bridgeまで実装済みで、Actionの自動抽出・照合・スワイプUIとはまだ接続していません。

画面設計の判断は `design.md` を参照してください。
