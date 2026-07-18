# Phase 5：Codex Plugin Mode

## 目的

Codex実履歴を一次Sourceとして取得し、Shared Coreで照合して、Codex内からレビューできるPluginを作る。

## 対象要件

FR-SRC-002〜003・006〜008、FR-CODEX-001〜005、Codexアーキテクチャ・履歴取得要件、AT-07。

## やること

### PluginとSkill

- [ ] Plugin manifestとREADMEを作る。
- [ ] 未完了事項を検出するスキルを作る。
- [ ] サンプルモードと実データモードを用意する。
- [ ] 入力、検出、照合・整理、実行上の注意度、承認、対応記録の手順をスキルへ記述する。
- [ ] Shared CoreとサンプルデータをPluginから再利用する。

### History Connector

- [ ] App Server接続を実装する。
- [ ] thread/listのページングに対応する。
- [ ] 期間、source kind、作業ディレクトリ、アーカイブ状態で絞る。
- [ ] 起動時に固定Workspace内の限定スコープを自動取得する。
- [ ] 確認UIなしで、限定スコープ内のスレッドだけthread/readする。
- [ ] ユーザー発言、Codex発言、コマンド、テスト、ファイル変更、承認を正規化する。
- [ ] Source単位の失敗を隔離する。

### Codex内Review

- [ ] 起動時に対象範囲と件数を内部的に確定する。
- [ ] Actionを番号付きの構造化一覧で表示する。
- [ ] Approve、Edit、Dismissを受け付ける。
- [ ] Evidenceと照合理由を展開できるようにする。
- [ ] Receiptをローカルへ保存する。
- [ ] 次回スキャンでClosedを抑止し、Partialは残条件だけ表示する。

## プライバシー要件

- 全履歴を既定で無差別走査せず、Workspace・アーカイブ状態・件数・本文サイズで上限を設ける。
- 原文の保持期間と保存範囲を最小化する。
- Receiptには必要最小限の引用だけを残す。
- Sourceを削除した際、由来Evidenceと未実行Proposalを削除可能にする。

## 完了条件

- [ ] READMEの手順でPluginを導入・起動できる。
- [ ] 明示コマンド1回でサンプル解析を開始できる。
- [ ] 実Codexスレッドを少なくとも3件読み取れる。
- [ ] 実履歴から少なくとも1Actionを生成できる。
- [ ] Codexの実行・テスト結果をExecution Evidenceとして扱える。
- [ ] Receiptを次回照合へ反映できる。

## 対応する受入テスト

- AT-07 Codex live scan
