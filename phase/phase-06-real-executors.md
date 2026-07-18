# Phase 6：実Executorと外部連携

## 目的

承認されたActionを実環境で安全に実行し、検証可能な成果物とReceiptへ結び付ける。

## 対象要件

FR-EXE-002〜007、FR-STA-001・003・005、Executor別要件、Intent-bound Approval、AT-08・09。

## 実装順

1. Research
2. Codex Task
3. Gmail Draft（Should）
4. Calendar Hold（Should）

Researchは外部書込みがなく成果物検証が容易なため、最初の実Executorにする。

## やること

### Research Executor

- [ ] テーマ、条件、成果物形式、保存先をPreviewする。
- [ ] 出典付きレポートを生成する。
- [ ] 成果物の存在と最低品質を検証する。
- [ ] 保存先と結果をReceiptに残す。

### Codex Task Executor

- [ ] 対象Repository、変更範囲、実行内容をPreviewする。
- [ ] 承認範囲を超える変更で再承認する。
- [ ] コード変更、テスト、ファイル更新を実行する。
- [ ] diff、テスト結果、残条件をReceiptへ記録する。

### Gmail Draft / Calendar Hold

- [ ] Gmailは下書き作成だけを許可する。
- [ ] Calendarは自分用Holdまたは招待未送信だけを許可する。
- [ ] 宛先、参加者、日時変更を再承認対象にする。
- [ ] OAuth tokenをSecretsとして管理し、ログへ出さない。

### 共通安全性

- [ ] 送信、購入、公開投稿、削除、支払を拒否する。
- [ ] 冪等性キーを外部呼び出しへ適用する。
- [ ] タイムアウト、部分成功、Retryを扱う。
- [ ] 実行結果を検証してからExecution completedにする。
- [ ] 残条件がある限り対応事項を完了済みにしない。

## 完了条件

- [ ] ResearchまたはCodex Taskが実成果物を作る。
- [ ] Payload Fidelityが100%である。
- [ ] 対象範囲拡大や重要属性変更で再承認になる。
- [ ] 実行失敗後に安全にRetryまたはDismissできる。
- [ ] 実行結果が次回照合のEvidenceになる。
- [ ] Gmail/Calendarを実装した場合、送信や外部通知が発生しない。

## 対応する受入テスト

- AT-08 Real execution
- AT-09 Safety
