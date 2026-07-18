export type SourceKind = "Meeting" | "ChatGPT" | "Codex";

export type ActionType = "Research" | "Calendar hold" | "Email draft" | "Codex task";

export type ActionStatus = "Ready" | "Needs input" | "Completed";

export type RiskLevel = "Low" | "Medium";

export type Evidence = {
  id: string;
  sourceKind: SourceKind;
  sourceTitle: string;
  occurredAt: string;
  quote: string;
  strength: "intent" | "explicit" | "execution";
};

export type CandidateAction = {
  id: string;
  groupKey: string;
  title: string;
  type: ActionType;
  statusHint: ActionStatus;
  confidence: number;
  actionable: boolean;
  owner: string;
  due?: string;
  executor: string;
  effect: string;
  evidence: Evidence;
  missingField?: string;
  inputOptions?: string[];
};

export type ActionProposal = {
  id: string;
  title: string;
  type: ActionType;
  status: Exclude<ActionStatus, "Completed">;
  risk: RiskLevel;
  confidence: number;
  owner: string;
  due?: string;
  executor: string;
  effect: string;
  evidence: Evidence[];
  reconciliationReason: string;
  missingField?: string;
  inputOptions?: string[];
  selectedInput?: string;
  additionalInstruction?: string;
};

export type AnalysisSummary = {
  sources: number;
  candidates: number;
  merged: number;
  completed: number;
  ready: number;
  lowConfidence: number;
};

export type CompletedAction = {
  title: string;
  reason: string;
  evidence: Evidence;
};

export type AnalysisResult = {
  summary: AnalysisSummary;
  proposals: ActionProposal[];
  completedActions: CompletedAction[];
};

export type ActionReceipt = {
  id: string;
  actionId: string;
  actionTitle: string;
  decision: "Executed" | "Dismissed";
  executor: string;
  result: string;
  createdAt: string;
  reversible: boolean;
};
