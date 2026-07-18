# Open Loop Inbox Companion

Codexを利用している各ユーザーのPC上で起動し、ローカルのCodex履歴を確認するためのCompanion Siteです。

> 注：以下の自動読込は要件更新後の次版仕様です。現在のコードは、Metadata取得後に選択されたThreadだけを確認付きで読む旧フローです。

## 現在の実装段階

- ローカル履歴へ安全に接続するBridgeを実装済みです。
- 次版では、起動時に固定Workspaceの対象タスクを自動取得し、限定範囲の本文読取まで行います。
- 次版では、ブラウザ上のタスク選択・本文読取確認UIを置きません。
- Actionの自動抽出・重複照合・カード化・スワイプ処理は次の実装段階です。

## 安全境界

- HTTPサーバーは`127.0.0.1`にだけbindします。
- 起動時に指定したWorkspaceだけを`thread/list`の対象にします。
- 対象は起動時に指定したWorkspace、非アーカイブ、上限件数の範囲に固定します。
- 起動時にMetadataを取得し、対象Threadを自動的に`thread/read`します。
- 本文はユーザー／アシスタントメッセージだけに正規化し、1件あたりの本文長・メッセージ数・全体件数を制限します。
- Codex App Serverとは子プロセスのstdioで通信し、外部APIへ履歴を送信しません。
- HostとOriginを検査し、公開ホストや別Originからのアクセスを拒否します。
- ブラウザへ返す本文は、自動読込スコープ内のユーザー／アシスタントメッセージだけです。コマンド出力やローカルファイル本文は返しません。

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

ブラウザで`http://127.0.0.1:4317`を開きます。ポートを変更する場合は`--port 4318`を追加してください。起動後、確認操作なしで対象履歴の読込を開始します。

起動後にWorkspaceを変更することはできません。別Workspaceを確認する場合は、サーバーを停止して対象を指定し直します。

## 自動読込

1. 起動時に固定WorkspaceのMetadataを取得します。
2. 非アーカイブかつ上限件数内のThreadだけを自動読込します。
3. 現在実行中のscanタスク、Workspace外のThread、一覧取得後に差し替えられたThreadは除外します。
4. 読み取った内容はローカルのデモサイト／Pluginへ渡すためだけに使用し、外部へ送信しません。

## テスト

```bash
cd companion
npm test
```

テストはCodex実履歴を読みません。モッククライアントを使い、Workspace絞り込み、自動読込の上限、現在タスク除外、Host／Origin拒否を検証します。

## API

- `GET /api/config` — 固定Workspaceとローカル実行状態
- `GET /api/threads?limit=10` — Workspace内の非アーカイブタスクと、限定読込済みの本文
- `POST /api/threads/read` — 内部処理用。ブラウザからの確認付き個別読取は提供しない

App Serverは開発用インターフェースのため、Codex CLI更新後はテストを再実行してください。
