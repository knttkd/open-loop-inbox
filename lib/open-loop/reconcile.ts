import type {
  ActionProposal,
  AnalysisResult,
  CandidateAction,
  RiskLevel,
} from "./types";

const strengthOrder = { intent: 0, explicit: 1, execution: 2 } as const;

function strongestCandidate(group: CandidateAction[]) {
  return [...group].sort((a, b) => {
    const evidenceDifference =
      strengthOrder[b.evidence.strength] - strengthOrder[a.evidence.strength];
    return evidenceDifference || b.confidence - a.confidence;
  })[0];
}

function riskFor(candidate: CandidateAction): RiskLevel {
  return candidate.type === "Email draft" || candidate.type === "Calendar hold"
    ? "Medium"
    : "Low";
}

export function reconcileCandidates(candidates: CandidateAction[]): AnalysisResult {
  const eligible = candidates.filter(
    (candidate) => candidate.actionable && candidate.confidence >= 0.65,
  );
  const lowConfidence = candidates.length - eligible.length;
  const groups = Map.groupBy(eligible, (candidate) => candidate.groupKey);
  const proposals: ActionProposal[] = [];
  const completedActions: AnalysisResult["completedActions"] = [];
  let merged = 0;

  for (const [groupKey, group] of groups) {
    merged += Math.max(0, group.length - 1);
    const strongest = strongestCandidate(group);
    const completionEvidence = group.find(
      (candidate) => candidate.statusHint === "Completed",
    );

    if (completionEvidence) {
      completedActions.push({
        title: completionEvidence.title,
        reason: "Codexの実行結果とテスト成功を、過去の依頼より強い完了証拠として採用しました。",
        evidence: completionEvidence.evidence,
      });
      continue;
    }

    proposals.push({
      id: `proposal-${groupKey}`,
      title: strongest.title,
      type: strongest.type,
      status: strongest.statusHint === "Needs input" ? "Needs input" : "Ready",
      risk: riskFor(strongest),
      confidence: Math.max(...group.map((candidate) => candidate.confidence)),
      owner: strongest.owner,
      due: strongest.due,
      executor: strongest.executor,
      effect: strongest.effect,
      evidence: group.map((candidate) => candidate.evidence),
      reconciliationReason:
        group.length > 1
          ? `${group.length}件を統合。後の会話にある、より具体的な条件を採用しました。`
          : strongest.statusHint === "Needs input"
            ? `${strongest.missingField}が原文にないため、実行前に一問だけ確認します。`
            : "明示的な依頼と実行対象が揃っているため、レビュー対象にしました。",
      missingField: strongest.missingField,
      inputOptions: strongest.inputOptions,
    });
  }

  const order = { Research: 0, "Calendar hold": 1, "Email draft": 2, "Codex task": 3 };
  proposals.sort((a, b) => order[a.type] - order[b.type]);

  return {
    summary: {
      sources: 5,
      candidates: candidates.length,
      merged,
      completed: completedActions.length,
      ready: proposals.length,
      lowConfidence,
    },
    proposals,
    completedActions,
  };
}
