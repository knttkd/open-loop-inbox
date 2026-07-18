# Open Loop Inbox Companion

Codexを利用している各ユーザーのPC上で起動し、ローカルのCodex履歴を確認するためのCompanion Siteです。

## 現在の実装段階

- ローカル履歴へ安全に接続するBridgeを実装済みです。
- 一覧のMetadata表示と、明示的に選択した1件の本文読取まで利用できます。
- Actionの自動抽出・重複照合・カード化・スワイプ処理は次の実装段階です。

## 安全境界

- HTTPサーバーは`127.0.0.1`にだけbindします。
- 起動時に指定したWorkspaceだけを`thread/list`の対象にします。
- 一覧ではタイトル・更新日時・Workspace・Sourceだけをブラウザへ返します。
- 一覧に表示したIDを選択し、確認付きリクエストを送った場合だけ`thread/read`を呼びます。
- Codex App Serverとは子プロセスのstdioで通信し、外部APIへ履歴を送信しません。
- HostとOriginを検査し、公開ホストや別Originからのアクセスを拒否します。
- ブラウザへ返す本文は、選択したタスクのユーザー／アシスタントメッセージだけです。コマンド出力やローカルファイル本文は返しません。

この構成では、公開WebサイトからユーザーPCの履歴へ直接アクセスできません。各ユーザーがこのリポジトリをcloneし、自分のPCでCompanionを起動します。

## 前提

- Node.js 22.13以上
- Codex CLIがインストール済み
- Codexへログイン済み

## 起動

```bash
cd companion
npm start -- --workspace /absolute/path/to/project
```

ブラウザで`http://127.0.0.1:4317`を開きます。ポートを変更する場合は`--port 4318`を追加してください。

起動後にWorkspaceを変更することはできません。別Workspaceを確認する場合は、サーバーを停止して対象を指定し直します。

## 操作

1. 「タスク一覧を確認」を押します。
2. タイトルと更新日時だけで対象を確認します。この時点では本文を読みません。
3. 対象行の「選択して本文を読む」を押します。
4. 選択した1件だけを`thread/read`で読み、ローカル画面へ表示します。

## テスト

```bash
cd companion
npm test
```

テストはCodex実履歴を読みません。モッククライアントを使い、Workspace絞り込み、選択前の読取拒否、明示確認、Host／Origin拒否を検証します。

## API

- `GET /api/config` — 固定Workspaceとローカル実行状態
- `GET /api/threads?limit=10` — Workspace内の非アーカイブタスクのメタデータ
- `POST /api/threads/read` — 一覧から選んだIDを、`confirmed: true`付きで1件だけ読取

App Serverは開発用インターフェースのため、Codex CLI更新後はテストを再実行してください。
