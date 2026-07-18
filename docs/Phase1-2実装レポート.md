# Phase 1〜2 実装レポート

## 実装範囲

### Phase 1：Shared Core

- Zodによるversion付き共通Schema
  - Source
  - Conversation Artifact / Turn
  - Evidence Span
  - Candidate Action / Condition
  - Reconciliation Group
  - Action Proposal / Execution Preview
  - Approval Decision
  - Execution Receipt
- Execution StatusとCommitment Statusの分離
- Source固有形式に依存しないConversation Artifact
- 5 Source / 7 Candidateのサンプルデータ
- Duplicate、最新条件、Partially closed、Closed、Needs input、Conflict、低Confidence隔離
- 22件の人手注釈済みゴールデン会話断片
- 11件のShared Coreテスト

サンプルの集計値は照合処理から次のように算出される。

```text
5 Sources
7 Candidates
2 Merged
1 Completed
1 Low confidence isolated
3 To Review
```

### Phase 2：Public Demo MVP

- Start画面と1クリック試用
- 導入、右、左、上の4段階Onboarding
- 操作方向のガイドアニメーション
- Onboarding完了通知後のSource読込
- Action Cardと3件のReview Queue
- Pointer、ボタン、キーボードによる判断
- Evidenceダイアログ
- 指示追加とNeeds inputのカード裏面UI
- 擬似Receiptと完了サマリー
- Cancel、二重処理防止、Undo、Reset
- sessionStorageによるQueue、Receipt、Undo履歴の復元
- モバイル表示とReduced Motion
- 4件のPublic Demo回帰テスト

## 検証結果

| 項目 | 結果 |
|---|---|
| Unit / UI tests | 15件成功 |
| TypeScript | 成功 |
| Production build | 成功 |
| Desktop E2E | StartからReceipt、Undoまで確認 |
| Mobile E2E | 390×844で主要操作を確認 |
| Lighthouse Accessibility | 100 |
| Lighthouse Best Practices | 100 |
| セッション復元 | Queue、Receipt、Undo履歴を復元 |

## 設計上の境界

Phase 2では体験確認のため、Approve後にブラウザ内で擬似Receiptを生成する。以下はPhase 3以降へ意図的に残している。

- Executor共通契約
- Intent-bound ApprovalのPayload比較
- 冪等性キーの永続化
- 実行失敗、部分成功、Retry
- Demo Gmail / Calendar / Research / Codex Taskの独立Executor
- Live AIとFallback切替
- 実サービスへの書込み

現在の二重処理防止はUIの実行中ロックであり、永続的な冪等性保証ではない。正式な安全境界はPhase 3で実装する。

## 主な参照

- [プロダクト要件](./プロダクト要件.md)
- [サイト要件](./サイト要件.md)
- [Phase全体ロードマップ](../phase/README.md)
