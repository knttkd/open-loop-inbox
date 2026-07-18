"use client";

import { useEffect, useRef, useState } from "react";
import { reconcileCandidates } from "../lib/open-loop/reconcile";
import { sampleCandidates, sampleSourceNames } from "../lib/open-loop/sample";
import type { ActionProposal, ActionReceipt } from "../lib/open-loop/types";

type Phase = "onboarding" | "onboarding-complete" | "analyzing" | "review" | "complete";
type Drag = { x: number; y: number; active: boolean };
type Snapshot = { queue: ActionProposal[]; receipts: ActionReceipt[] };
type InputMode = "needs-input" | "instruction" | "onboarding-instruction";

const analysis = reconcileCandidates(sampleCandidates);

const typeLabels: Record<ActionProposal["type"], string> = {
  Research: "RESEARCH",
  "Calendar hold": "CALENDAR HOLD",
  "Email draft": "EMAIL DRAFT",
  "Codex task": "CODEX TASK",
};

const sourceMarks = { Meeting: "M", ChatGPT: "C", Codex: "X" };

const typeGlyphs: Record<ActionProposal["type"], string> = {
  Research: "R",
  "Calendar hold": "C",
  "Email draft": "E",
  "Codex task": "X",
};

const evidenceStrengthLabels = {
  intent: "INTENT",
  explicit: "EXPLICIT",
  execution: "EXECUTION",
} as const;

type OnboardingStep = {
  direction: "right" | "left" | "up" | null;
  label: string;
  kicker: string;
  title: string;
  sentences: Array<{ before: string; emphasis?: string; after?: string }>;
};

const onboardingSteps: OnboardingStep[] = [
  {
    direction: null,
    label: "はじめに",
    kicker: "OPEN LOOP INBOX",
    title: "このサービスは？",
    sentences: [
      { before: "Open Loop Inboxは、Codexの複数スレッドに残った依頼やネクストアクションを回収し、後続の会話と実行結果まで照合するInboxです。" },
      { before: "同じ依頼は一つにまとめ、すでに終わった作業は除外し、条件が足りない作業は一問だけ確認します。" },
      { before: "実行方法としては、マシン上でのローカルホスト、またはCodex内のプラグインを通しての実行を想定しています。" },
    ],
  },
  {
    direction: "right",
    label: "右へスワイプ",
    kicker: "EXECUTE",
    title: "右スワイプは「実行」",
    sentences: [
      { before: "カードに表示された内容でActionを実行します。" },
      { before: "追加情報が必要な場合は", emphasis: "実行前に確認", after: "します。" },
    ],
  },
  {
    direction: "left",
    label: "左へスワイプ",
    kicker: "DISMISS",
    title: "左スワイプは「見送る」",
    sentences: [
      { before: "今回は対応しない判断として記録します。" },
      { before: "Actionは実行せず、次のカードへ進みます。" },
      { before: "直後ならUndoできます。" },
    ],
  },
  {
    direction: "up",
    label: "上へスワイプ",
    kicker: "ADD INSTRUCTION",
    title: "上スワイプは「指示を追加」",
    sentences: [
      { before: "推奨候補を選ぶか、自分の言葉で指示を書けます。" },
      { before: "追加した指示を含めてActionを実行します。" },
    ],
  },
];

const instructionSuggestions: Record<ActionProposal["type"], string[]> = {
  Research: ["出典URLを必ず付ける", "重要な3点を先に要約する", "比較表を最後に追加する"],
  "Calendar hold": ["前後15分の余白を確保する", "予定名に「仮」を付ける", "振り返り用のメモ欄を追加する"],
  "Email draft": ["要点を3行以内にまとめる", "確認事項を箇条書きにする", "やわらかいトーンで書く"],
  "Codex task": ["変更理由をコメントに残す", "テストも一緒に追加する", "差分を最小限にする"],
};

function nowLabel() {
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function taskSummary(action: ActionProposal) {
  const due = action.due ? `期限は${action.due}です。` : "期限はまだ設定されていません。";
  return `${action.owner}が「${action.title}」を進めます。${action.effect}${due}`;
}

function contextSummary(action: ActionProposal) {
  const strongest = action.evidence[action.evidence.length - 1];
  const origin =
    strongest.strength === "explicit"
      ? "具体的な依頼として明示されました。"
      : strongest.strength === "execution"
        ? "実行結果として記録されました。"
        : "今後行いたいこととして言及されました。";
  const merged =
    action.evidence.length > 1
      ? `関連する${action.evidence.length}件の会話を照合し、より具体的な条件を採用しています。`
      : "この発言をもとにAction候補になりました。";
  return `${strongest.sourceKind}「${strongest.sourceTitle}」（${strongest.occurredAt}）で、${origin}${merged}`;
}

type CardIntent = "approve" | "dismiss" | "edit" | null;

type ReviewCardProps = {
  action: ActionProposal;
  number: string;
  drag: Drag;
  intent: CardIntent;
  className?: string;
  onPointerDown: (event: React.PointerEvent) => void;
  onPointerMove: (event: React.PointerEvent) => void;
  onPointerUp: () => void;
  onOpenDetail: () => void;
  onDismiss?: () => void;
  onInstruction?: () => void;
  onApprove?: () => void;
};

function ReviewCard({
  action,
  number,
  drag,
  intent,
  className = "",
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onOpenDetail,
  onDismiss,
  onInstruction,
  onApprove,
}: ReviewCardProps) {
  const strongestEvidence = action.evidence[action.evidence.length - 1];
  const typeClass = action.type.toLowerCase().replaceAll(" ", "-");

  return (
    <article
      className={`action-card card-type-${typeClass} ${intent ? `intent-${intent}` : ""} ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ transform: `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x / 28}deg)` }}
    >
      <div className="intent-label dismiss-label">DISMISS</div>
      <div className="intent-label approve-label">EXECUTE</div>
      <div className="intent-label edit-label">ADD INSTRUCTION</div>
      <header className="card-header">
        <div className="type-heading">
          <span className={`type-glyph type-${typeClass}`}>{typeGlyphs[action.type]}</span>
          <span className={`type-chip type-${typeClass}`}>{typeLabels[action.type]}</span>
        </div>
        <div className="card-badges">
          <span className={`status-badge ${action.status === "Needs input" ? "needs" : ""}`}>{action.status}</span>
          <span className="risk-badge">{action.risk} risk</span>
        </div>
      </header>
      <div className="card-number">{number}</div>
      <h3>{action.title}</h3>
      <div className="preview-box">
        <span>実行すると</span>
        <strong>{action.executor}</strong>
        <p>{action.effect}</p>
        {action.additionalInstruction && <p className="added-instruction"><b>追加指示</b>{action.additionalInstruction}</p>}
      </div>
      <div className="meta-row">
        <div><small>OWNER</small><b>{action.owner}</b></div>
        <div><small>DUE</small><b>{action.due ?? "未設定"}</b></div>
        <div><small>CONFIDENCE</small><b>{Math.round(action.confidence * 100)}%</b></div>
      </div>
      <button className="evidence-box" onPointerDown={(event) => event.stopPropagation()} onClick={onOpenDetail}>
        <span className={`source-icon small ${strongestEvidence.sourceKind.toLowerCase()}`}>{sourceMarks[strongestEvidence.sourceKind]}</span>
        <span><small>STRONGEST EVIDENCE · {strongestEvidence.sourceKind}</small><q>{strongestEvidence.quote}</q></span>
        <b>＋</b>
      </button>
      <p className="reconcile-note"><span>↳</span>{action.reconciliationReason}</p>
      <div className="card-actions" onPointerDown={(event) => event.stopPropagation()}>
        <button onClick={onDismiss} aria-disabled={!onDismiss} tabIndex={onDismiss ? 0 : -1} aria-label="見送る">×</button>
        <button onClick={onInstruction} aria-disabled={!onInstruction} tabIndex={onInstruction ? 0 : -1} aria-label="指示を追加して実行">↑</button>
        <button className="approve-action" onClick={onApprove} aria-disabled={!onApprove} tabIndex={onApprove ? 0 : -1} aria-label="実行">✓</button>
      </div>
    </article>
  );
}

export default function OpenLoopInbox() {
  const [phase, setPhase] = useState<Phase>("onboarding");
  const [analysisStep, setAnalysisStep] = useState(0);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [queue, setQueue] = useState<ActionProposal[]>(analysis.proposals);
  const [receipts, setReceipts] = useState<ActionReceipt[]>([]);
  const [drag, setDrag] = useState<Drag>({ x: 0, y: 0, active: false });
  const [onboardingDrag, setOnboardingDrag] = useState<Drag>({ x: 0, y: 0, active: false });
  const [onboardingFeedbackOpen, setOnboardingFeedbackOpen] = useState(false);
  const [onboardingSettling, setOnboardingSettling] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode | null>(null);
  const [instructionDraft, setInstructionDraft] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [executing, setExecuting] = useState(false);
  const [instructionTransitioning, setInstructionTransitioning] = useState(false);
  const [lastSnapshot, setLastSnapshot] = useState<Snapshot | null>(null);
  const startPoint = useRef({ x: 0, y: 0 });
  const onboardingStartPoint = useRef({ x: 0, y: 0 });
  const executingRef = useRef(false);
  const detailPanelRef = useRef<HTMLElement>(null);
  const helpPanelRef = useRef<HTMLElement>(null);
  const inputPanelRef = useRef<HTMLElement>(null);
  const onboardingFeedbackPanelRef = useRef<HTMLElement>(null);
  const onboardingFeedbackTimerRef = useRef<number | null>(null);
  const instructionTransitionTimerRef = useRef<number | null>(null);
  const lastFocusedElement = useRef<HTMLElement | null>(null);
  const inputOriginSnapshot = useRef<Snapshot | null>(null);

  const current = queue[0];
  const onboardingSample = analysis.proposals[0];
  const onboardingStepData = onboardingSteps[onboardingStep];
  const onboardingDirection = onboardingStepData.direction;
  const inputOpen = inputMode !== null;
  const progress = analysis.proposals.length
    ? receipts.length / analysis.proposals.length
    : 1;

  useEffect(() => {
    const saved = sessionStorage.getItem("open-loop-rehearsal");
    if (!saved) return;
    let restoreTimer: number | undefined;
    try {
      const parsed = JSON.parse(saved) as {
        phase: Phase | "start";
        queue: ActionProposal[];
        receipts: ActionReceipt[];
      };
      restoreTimer = window.setTimeout(() => {
        setPhase(parsed.phase === "start" ? "onboarding" : parsed.phase);
        setQueue(parsed.queue);
        setReceipts(parsed.receipts);
      }, 0);
    } catch {
      sessionStorage.removeItem("open-loop-rehearsal");
    }
    return () => {
      if (restoreTimer) window.clearTimeout(restoreTimer);
    };
  }, []);

  useEffect(() => {
    if (phase === "analyzing") return;
    sessionStorage.setItem(
      "open-loop-rehearsal",
      JSON.stringify({ phase, queue, receipts }),
    );
  }, [phase, queue, receipts]);

  useEffect(() => {
    if (phase !== "onboarding-complete") return;
    const completionTimer = window.setTimeout(() => {
      setPhase("analyzing");
    }, 1200);
    return () => window.clearTimeout(completionTimer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "analyzing") return;
    const stepTimers = [1, 2, 3, 4, 5].map((step, index) =>
      window.setTimeout(() => setAnalysisStep(step), 260 * (index + 1)),
    );
    const reviewTimer = window.setTimeout(() => setPhase("review"), 1650);
    return () => {
      stepTimers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(reviewTimer);
    };
  }, [phase]);

  useEffect(() => {
    return () => {
      if (onboardingFeedbackTimerRef.current) {
        window.clearTimeout(onboardingFeedbackTimerRef.current);
      }
      if (instructionTransitionTimerRef.current) {
        window.clearTimeout(instructionTransitionTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const panel = detailOpen
      ? detailPanelRef.current
      : inputOpen
        ? inputPanelRef.current
        : helpOpen
          ? helpPanelRef.current
          : onboardingFeedbackOpen
            ? onboardingFeedbackPanelRef.current
            : null;
    panel?.querySelector<HTMLElement>("button")?.focus();
  }, [detailOpen, helpOpen, inputOpen, onboardingFeedbackOpen]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (inputOpen && !executing) {
        setInputMode(null);
        setInstructionDraft("");
        setCustomInput("");
        inputOriginSnapshot.current = null;
      }
      else if (detailOpen) setDetailOpen(false);
      else if (helpOpen) setHelpOpen(false);
      else if (onboardingFeedbackOpen) {
        setOnboardingFeedbackOpen(false);
        setOnboardingDrag({ x: 0, y: 0, active: false });
      }
      else return;
      window.requestAnimationFrame(() => lastFocusedElement.current?.focus());
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [detailOpen, helpOpen, inputOpen, executing, onboardingFeedbackOpen]);

  function finishOnboarding() {
    setInputMode(null);
    setInstructionDraft("");
    setCustomInput("");
    setAnalysisStep(0);
    setPhase("onboarding-complete");
  }

  function saveSnapshot() {
    setLastSnapshot({ queue, receipts });
  }

  function rememberFocus() {
    if (document.activeElement instanceof HTMLElement) {
      lastFocusedElement.current = document.activeElement;
    }
  }

  function openDetail() {
    rememberFocus();
    setDetailOpen(true);
  }

  function closeDetail() {
    setDetailOpen(false);
    window.requestAnimationFrame(() => lastFocusedElement.current?.focus());
  }

  function openHelp() {
    rememberFocus();
    setHelpOpen(true);
  }

  function closeHelp() {
    setHelpOpen(false);
    window.requestAnimationFrame(() => lastFocusedElement.current?.focus());
  }

  function openInput(mode: InputMode = "instruction") {
    if (executingRef.current) return;
    rememberFocus();
    setInstructionDraft("");
    setCustomInput("");
    inputOriginSnapshot.current = mode === "onboarding-instruction" ? null : { queue, receipts };
    setInputMode(mode);
  }

  function openInstructionWithFlip() {
    if (executingRef.current || instructionTransitioning) return;
    setInstructionTransitioning(true);
    instructionTransitionTimerRef.current = window.setTimeout(() => {
      setInstructionTransitioning(false);
      instructionTransitionTimerRef.current = null;
      openInput("instruction");
    }, 320);
  }

  function openNeedsInputWithFlip() {
    if (executingRef.current || instructionTransitioning) return;
    setInstructionTransitioning(true);
    instructionTransitionTimerRef.current = window.setTimeout(() => {
      setInstructionTransitioning(false);
      instructionTransitionTimerRef.current = null;
      openInput("needs-input");
    }, 320);
  }

  function closeInput() {
    if (executingRef.current) return;
    setInputMode(null);
    setInstructionDraft("");
    setCustomInput("");
    inputOriginSnapshot.current = null;
    window.requestAnimationFrame(() => lastFocusedElement.current?.focus());
  }

  function createReceipt(action: ActionProposal, decision: "Executed" | "Dismissed") {
    const baseResult =
      decision === "Dismissed"
        ? "今回は対応しない判断を記録しました。次回スキャンで抑制します。"
        : action.type === "Research"
          ? "5件の事例をまとめた調査メモをDemo Codexに作成しました。"
          : action.type === "Calendar hold"
            ? `${action.selectedInput}に30分の仮予定を作成しました。通知は送っていません。`
            : "宛先・件名・本文を含むメール下書きを作成しました。送信はしていません。";
    const result =
      decision === "Executed" && action.additionalInstruction
        ? `${baseResult} 追加指示「${action.additionalInstruction}」を反映しました。`
        : baseResult;

    return {
      id: `receipt-${action.id}-${receipts.length + 1}`,
      actionId: action.id,
      actionTitle: action.title,
      decision,
      executor: decision === "Dismissed" ? "Open Loop Inbox" : action.executor,
      result,
      createdAt: nowLabel(),
      reversible: true,
    } satisfies ActionReceipt;
  }

  function runExecution(action: ActionProposal, stagedQueue = queue) {
    if (executingRef.current) return;
    setLastSnapshot(inputOriginSnapshot.current ?? { queue, receipts });
    inputOriginSnapshot.current = null;
    executingRef.current = true;
    setQueue(stagedQueue);
    setInputMode(null);
    setInstructionDraft("");
    setCustomInput("");
    setExecuting(true);
    window.setTimeout(() => {
      const remaining = stagedQueue.filter((item) => item.id !== action.id);
      setReceipts((items) => [...items, createReceipt(action, "Executed")]);
      setQueue(remaining);
      executingRef.current = false;
      setExecuting(false);
      setDrag({ x: 0, y: 0, active: false });
      if (remaining.length === 0) setPhase("complete");
    }, 850);
  }

  function execute(action: ActionProposal) {
    if (executingRef.current) return;
    if (action.status === "Needs input" && !action.selectedInput) {
      openNeedsInputWithFlip();
      return;
    }
    runExecution(action);
  }

  function dismiss(action: ActionProposal) {
    if (executingRef.current) return;
    saveSnapshot();
    const remaining = queue.filter((item) => item.id !== action.id);
    setReceipts((items) => [...items, createReceipt(action, "Dismissed")]);
    setQueue(remaining);
    setDrag({ x: 0, y: 0, active: false });
    if (remaining.length === 0) setPhase("complete");
  }

  function chooseInput(value: string) {
    const normalizedValue = value.trim();
    if (!current || executingRef.current || !normalizedValue) return;
    const selectedAction: ActionProposal = {
      ...current,
      status: "Ready",
      selectedInput: normalizedValue,
      due: normalizedValue,
      effect:
        current.type === "Calendar hold"
          ? `${normalizedValue}に自分用の仮予定を作成します。招待や通知は送りません。`
          : current.effect,
    };
    const stagedQueue = queue.map((item) =>
      item.id === current.id ? selectedAction : item,
    );
    runExecution(selectedAction, stagedQueue);
  }

  function submitInstruction() {
    const instruction = instructionDraft.trim();
    if (!instruction || executingRef.current) return;
    if (inputMode === "onboarding-instruction") {
      finishOnboarding();
      return;
    }
    if (!current) return;
    const instructedAction: ActionProposal = {
      ...current,
      additionalInstruction: instruction,
    };
    const stagedQueue = queue.map((item) =>
      item.id === current.id ? instructedAction : item,
    );
    if (current.status === "Needs input" && !current.selectedInput) {
      setQueue(stagedQueue);
      setInstructionDraft("");
      setCustomInput("");
      setInputMode("needs-input");
      return;
    }
    runExecution(instructedAction, stagedQueue);
  }

  function undo() {
    if (!lastSnapshot) return;
    setQueue(lastSnapshot.queue);
    setReceipts(lastSnapshot.receipts);
    setPhase("review");
    setLastSnapshot(null);
  }

  function reset() {
    sessionStorage.removeItem("open-loop-rehearsal");
    if (onboardingFeedbackTimerRef.current) {
      window.clearTimeout(onboardingFeedbackTimerRef.current);
      onboardingFeedbackTimerRef.current = null;
    }
    if (instructionTransitionTimerRef.current) {
      window.clearTimeout(instructionTransitionTimerRef.current);
      instructionTransitionTimerRef.current = null;
    }
    executingRef.current = false;
    setPhase("onboarding");
    setOnboardingStep(0);
    setQueue(analysis.proposals);
    setReceipts([]);
    setLastSnapshot(null);
    setDetailOpen(false);
    setHelpOpen(false);
    setInputMode(null);
    setInstructionDraft("");
    setCustomInput("");
    setOnboardingDrag({ x: 0, y: 0, active: false });
    setOnboardingFeedbackOpen(false);
    setOnboardingSettling(false);
    inputOriginSnapshot.current = null;
    setExecuting(false);
    setInstructionTransitioning(false);
  }

  function pointerDown(event: React.PointerEvent) {
    if (!current || executing || instructionTransitioning) return;
    startPoint.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ x: 0, y: 0, active: true });
  }

  function pointerMove(event: React.PointerEvent) {
    if (!drag.active) return;
    setDrag({
      x: event.clientX - startPoint.current.x,
      y: event.clientY - startPoint.current.y,
      active: true,
    });
  }

  function pointerUp() {
    if (!current) return;
    if (drag.x > 105) execute(current);
    else if (drag.x < -105) dismiss(current);
    else if (drag.y < -90) openInstructionWithFlip();
    setDrag({ x: 0, y: 0, active: false });
  }

  function keyDown(event: React.KeyboardEvent) {
    if (!current || executing || instructionTransitioning || detailOpen || helpOpen || inputOpen) return;
    if (event.key === "ArrowRight" || event.key === "Enter") execute(current);
    if (event.key === "ArrowLeft") dismiss(current);
    if (event.key === "ArrowUp") openInstructionWithFlip();
  }

  function completeOnboardingGesture() {
    if (onboardingSettling || onboardingFeedbackOpen) return;
    const direction = onboardingDirection;
    if (!direction) return;
    const destination =
      direction === "right"
        ? { x: 560, y: 0 }
        : direction === "left"
          ? { x: -560, y: 0 }
          : { x: 0, y: 0 };
    setOnboardingSettling(true);
    setOnboardingDrag({ ...destination, active: false });
    onboardingFeedbackTimerRef.current = window.setTimeout(() => {
      setOnboardingFeedbackOpen(true);
      setOnboardingSettling(false);
      onboardingFeedbackTimerRef.current = null;
    }, direction === "up" ? 320 : 240);
  }

  function advanceOnboardingFromFeedback() {
    setOnboardingFeedbackOpen(false);
    setOnboardingDrag({ x: 0, y: 0, active: false });
    if (onboardingStep === onboardingSteps.length - 1) {
      openInput("onboarding-instruction");
    } else {
      setOnboardingStep((step) => step + 1);
    }
  }

  function retryOnboardingGesture() {
    setOnboardingFeedbackOpen(false);
    setOnboardingDrag({ x: 0, y: 0, active: false });
  }

  function advanceOnboardingIntro() {
    setOnboardingStep((step) => Math.min(step + 1, onboardingSteps.length - 1));
  }

  function skipOnboarding() {
    if (onboardingFeedbackTimerRef.current) {
      window.clearTimeout(onboardingFeedbackTimerRef.current);
      onboardingFeedbackTimerRef.current = null;
    }
    setOnboardingFeedbackOpen(false);
    setOnboardingSettling(false);
    setOnboardingDrag({ x: 0, y: 0, active: false });
    finishOnboarding();
  }

  function onboardingPointerDown(event: React.PointerEvent) {
    if (!onboardingDirection || onboardingSettling || onboardingFeedbackOpen) return;
    onboardingStartPoint.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
    setOnboardingDrag({ x: 0, y: 0, active: true });
  }

  function onboardingPointerMove(event: React.PointerEvent) {
    if (!onboardingDrag.active) return;
    setOnboardingDrag({
      x: event.clientX - onboardingStartPoint.current.x,
      y: event.clientY - onboardingStartPoint.current.y,
      active: true,
    });
  }

  function onboardingPointerUp() {
    const expected = onboardingDirection;
    if (!expected) return;
    const completed =
      (expected === "right" && onboardingDrag.x > 95) ||
      (expected === "left" && onboardingDrag.x < -95) ||
      (expected === "up" && onboardingDrag.y < -80);
    if (completed) completeOnboardingGesture();
    else setOnboardingDrag({ x: 0, y: 0, active: false });
  }

  function onboardingKeyDown(event: React.KeyboardEvent) {
    if (event.target instanceof HTMLButtonElement || event.target instanceof HTMLTextAreaElement) return;
    const expected = onboardingDirection;
    if (!expected) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        advanceOnboardingIntro();
      }
      return;
    }
    if (
      (expected === "right" && event.key === "ArrowRight") ||
      (expected === "left" && event.key === "ArrowLeft") ||
      (expected === "up" && event.key === "ArrowUp")
    ) completeOnboardingGesture();
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      completeOnboardingGesture();
    }
  }

  const dragIntent =
    drag.x > 55 ? "approve" : drag.x < -55 ? "dismiss" : drag.y < -50 ? "edit" : null;
  const onboardingIntent =
    onboardingDrag.x > 45
      ? "approve"
      : onboardingDrag.x < -45
        ? "dismiss"
        : onboardingDrag.y < -40
          ? "edit"
          : null;
  const instructionCard = current && (inputMode === "instruction" || inputMode === "onboarding-instruction") ? (
    <section
      ref={inputPanelRef}
      className="action-card instruction-card-surface feedback-flip-in"
      role="dialog"
      aria-label="指示を追加して実行"
    >
      <button className="modal-close" onClick={closeInput} aria-label="閉じて元のカードへ戻る">×</button>
      <span className="input-kicker instruction-kicker">ADD INSTRUCTION</span>
      <h2>{inputMode === "onboarding-instruction" ? "指示を追加してみましょう" : "どんな指示を追加しますか？"}</h2>
      <p>{inputMode === "onboarding-instruction" ? "推奨候補を選んでも、自分の言葉で書いても構いません。この練習では実際のActionは実行されません。" : "推奨候補を選ぶか、自由に書いてください。追加した指示を含めて、このActionを実行します。"}</p>
      <div className="suggestion-block">
        <small>RECOMMENDED</small>
        <div className={`suggestion-list ${instructionDraft ? "" : "guided-suggestions"}`}>
          {instructionSuggestions[current.type].map((suggestion) => (
            <button
              className={instructionDraft === suggestion ? "selected" : ""}
              key={suggestion}
              onClick={() => setInstructionDraft(suggestion)}
            >
              <span>＋</span>{suggestion}
            </button>
          ))}
        </div>
      </div>
      <label className="free-input-block instruction-input">
        <span>自分で指示を書く</span>
        <textarea
          value={instructionDraft}
          onChange={(event) => setInstructionDraft(event.target.value)}
          placeholder="例：結論を最初に書き、根拠のURLを付けてください"
          maxLength={240}
          rows={4}
        />
        <small>{instructionDraft.length} / 240</small>
      </label>
      <button className="execute-with-input instruction-execute" onClick={submitInstruction} disabled={!instructionDraft.trim() || executing}>
        {inputMode === "onboarding-instruction" ? "練習を完了する" : "指示を追加して実行"} <b>→</b>
      </button>
    </section>
  ) : null;
  const needsInputCard = current && inputMode === "needs-input" ? (
    <section
      ref={inputPanelRef}
      className="action-card needs-input-card-surface feedback-flip-in"
      role="dialog"
      aria-label="不足情報を入力"
    >
      <button className="modal-close" onClick={closeInput} aria-label="閉じて元のカードへ戻る">×</button>
      <span className="input-kicker">ONE QUESTION</span>
      <h2>{current.missingField ? `${current.missingField}を選ぶか入力してください` : "不足情報を入力してください"}</h2>
      <p>推奨候補から選ぶか、候補にない内容を自分で入力できます。確定後は処理を完了し、次のActionへ進みます。</p>
      <div className="option-list">
        {(current.inputOptions ?? [current.due ?? "現在の内容で確定"]).map((option) => (
          <button key={option} onClick={() => chooseInput(option)} disabled={executing}><span>{option}</span><b>選択して実行 →</b></button>
        ))}
      </div>
      <div className="input-divider"><span>または</span></div>
      <label className="free-input-block">
        <span>自分で入力</span>
        <textarea
          value={customInput}
          onChange={(event) => setCustomInput(event.target.value)}
          placeholder={`${current.missingField ?? "必要な情報"}を入力してください`}
          rows={2}
        />
      </label>
      <button className="execute-with-input" onClick={() => chooseInput(customInput)} disabled={!customInput.trim() || executing}>
        この内容で実行 <b>→</b>
      </button>
    </section>
  ) : null;

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={reset} aria-label="Open Loop Inbox ホームへ戻る">
          <span className="brand-mark">OL</span>
          <span>OPEN LOOP INBOX</span>
        </button>
        <div className="topbar-actions">
          <span className="demo-pill"><i /> JUDGE SANDBOX</span>
          {phase !== "onboarding" && <button className="text-button" onClick={reset}>Reset</button>}
        </div>
      </header>

      {phase === "analyzing" && (
        <section className="analysis-view" aria-live="polite">
          <div className="analysis-orbit"><span>{analysisStep}/5</span></div>
          <div>
            <p className="eyebrow"><span>03</span> LOADING OPEN LOOPS</p>
            <h2>タスクを読み込んでいます</h2>
            <p className="analysis-current">
              {analysisStep < 5 ? sampleSourceNames[analysisStep] : "未完了タスクを整理中"}
            </p>
          </div>
          <div className="analysis-list">
            {sampleSourceNames.map((source, index) => (
              <div className={index < analysisStep ? "done" : ""} key={source}>
                <span>{index < analysisStep ? "✓" : String(index + 1).padStart(2, "0")}</span>
                <p>{source}</p><small>{index < analysisStep ? "LOADED" : "WAITING"}</small>
              </div>
            ))}
          </div>
        </section>
      )}

      {phase === "onboarding-complete" && (
        <section className="onboarding-complete-view" aria-live="assertive">
          <div className="onboarding-complete-card">
            <div className="onboarding-complete-mark" aria-hidden="true">✓</div>
            <p className="onboarding-complete-kicker">ONBOARDING COMPLETE</p>
            <h2>操作練習が完了しました</h2>
            <p>未完了タスクを読み込みます。</p>
            <div className="onboarding-complete-progress" aria-hidden="true"><i /><i /><i /></div>
          </div>
        </section>
      )}

      {(phase === "onboarding" || phase === "review" || phase === "complete") && (
        <section className="workspace">
          {phase === "onboarding" && (
            <div className="review-view onboarding-review">
              <div className="practice-heading">
                <p className="eyebrow"><span>02</span> PRACTICE WITH A REAL CARD</p>
                <h2>まずは試してみましょう</h2>
              </div>
              <div className="queue-pill practice-progress">
                <span>案内 {onboardingStep + 1}/{onboardingSteps.length}</span>
                <i><b style={{ width: `${(onboardingStep / onboardingSteps.length) * 100}%` }} /></i>
              </div>
              <div
                className="deck-stage onboarding-deck"
                onKeyDown={onboardingKeyDown}
                tabIndex={0}
                aria-label={`Onboarding ${onboardingStep + 1}/${onboardingSteps.length}。${onboardingStepData.label}`}
              >
                <div className="action-card card-behind" aria-hidden="true" />
                {!onboardingDirection && (
                  <section className="action-card onboarding-intro-card">
                    <span>{onboardingStepData.kicker}</span>
                    <h3>{onboardingStepData.title}</h3>
                    <p>{onboardingStepData.sentences[0].before}</p>
                    <button onClick={advanceOnboardingIntro}>操作を試す <b>→</b></button>
                  </section>
                )}
                {onboardingDirection && inputMode !== "onboarding-instruction" && !onboardingFeedbackOpen && !onboardingSettling && (
                  <div className={`swipe-coach coach-${onboardingDirection}`} aria-live="polite">
                    <span>{onboardingDirection === "right" ? "→" : onboardingDirection === "left" ? "←" : "↑"}</span>
                    <b>{onboardingStepData.label}してみてください</b>
                  </div>
                )}
                {onboardingDirection && inputMode !== "onboarding-instruction" && !onboardingFeedbackOpen && (
                  <ReviewCard
                    action={onboardingSample}
                    number="01"
                    drag={onboardingDrag}
                    intent={onboardingIntent}
                    className={`onboarding-card-demo ${!onboardingDrag.active && !onboardingSettling ? `onboarding-guide-${onboardingDirection}` : ""} ${onboardingSettling && onboardingDirection === "up" ? "card-flip-out" : ""}`}
                    onPointerDown={onboardingPointerDown}
                    onPointerMove={onboardingPointerMove}
                    onPointerUp={onboardingPointerUp}
                    onOpenDetail={openDetail}
                    onDismiss={onboardingDirection === "left" ? completeOnboardingGesture : undefined}
                    onInstruction={onboardingDirection === "up" ? completeOnboardingGesture : undefined}
                    onApprove={onboardingDirection === "right" ? completeOnboardingGesture : undefined}
                  />
                )}
                {onboardingDirection && onboardingFeedbackOpen && (
                  <section
                    ref={onboardingFeedbackPanelRef}
                    className={`action-card onboarding-feedback-card feedback-card-${onboardingDirection} ${onboardingDirection === "up" ? "feedback-flip-in" : ""}`}
                    role="dialog"
                    aria-label={`${onboardingStepData.title}の説明`}
                  >
                    <button className="modal-close" onClick={retryOnboardingGesture} aria-label="閉じてもう一度試す">×</button>
                    <div className={`feedback-gesture feedback-${onboardingDirection}`} aria-hidden="true">
                      {onboardingDirection === "right" ? "→" : onboardingDirection === "left" ? "←" : "↑"}
                    </div>
                    <span className="feedback-kicker">{onboardingStepData.kicker}</span>
                    <h2>{onboardingStepData.title}</h2>
                    <div className="feedback-copy">
                      {onboardingStepData.sentences.map((sentence, index) => (
                        <p key={`${sentence.before}-${index}`}>
                          {sentence.before}
                          {sentence.emphasis && <strong>{sentence.emphasis}</strong>}
                          {sentence.after}
                        </p>
                      ))}
                    </div>
                    <div className="feedback-note"><span>✓</span><p>これは練習です。<br />Actionの実行やReceiptの作成は行っていません。</p></div>
                    <button className="feedback-next" onClick={advanceOnboardingFromFeedback}>
                      <span>{onboardingStep === onboardingSteps.length - 1 ? "指示入力を試す" : "次の操作へ"}</span><b>→</b>
                    </button>
                  </section>
                )}
                {inputMode === "onboarding-instruction" && instructionCard}
                {onboardingDirection && inputMode !== "onboarding-instruction" && !onboardingFeedbackOpen && <p className="deck-hint">カードの動きに合わせてスワイプ · 矢印キーでも操作できます</p>}
              </div>
              <div className="onboarding-review-footer">
                <span>練習ではActionやReceiptは変更されません</span>
                <button onClick={skipOnboarding}>練習をスキップ</button>
              </div>
            </div>
          )}

          {phase === "review" && current && (
            <div className="review-view">
              <div className="queue-pill">
                <span>残り {queue.length}/{analysis.summary.ready}</span>
                <i><b style={{ width: `${progress * 100}%` }} /></i>
              </div>
              <div className={`deck-stage ${inputMode === "needs-input" ? "deck-stage-needs-input" : ""}`} onKeyDown={keyDown} tabIndex={0} aria-label="Action review deck">
                {queue[1] && <div className="action-card card-behind" aria-hidden="true" />}
                {!inputOpen && (
                  <ReviewCard
                    action={current}
                    number={`0${receipts.length + 1}`}
                    drag={drag}
                    intent={dragIntent}
                    className={instructionTransitioning ? "card-flip-out" : ""}
                    onPointerDown={pointerDown}
                    onPointerMove={pointerMove}
                    onPointerUp={pointerUp}
                    onOpenDetail={openDetail}
                    onDismiss={() => dismiss(current)}
                    onInstruction={openInstructionWithFlip}
                    onApprove={() => execute(current)}
                  />
                )}
                {inputMode === "instruction" && instructionCard}
                {inputMode === "needs-input" && needsInputCard}
                {executing && <div className="execution-overlay"><span className="spinner" /><strong>{current.executor}</strong><p>承認内容を照合して実行中…</p></div>}
                {!inputOpen && <p className="deck-hint">カードをスワイプ、またはボタン・矢印キーで操作</p>}
              </div>
              <div className="review-tools">
                <button className="help-button" onClick={openHelp} aria-label="操作説明を開く">?</button>
                {lastSnapshot && <button className="undo-button" onClick={undo}>↶ 直前の判断を取り消す</button>}
              </div>
            </div>
          )}

          {phase === "complete" && (
            <div className="complete-view">
              <div className="confetti" aria-hidden="true">
                {Array.from({ length: 9 }, (_, index) => <i key={index} />)}
              </div>
              <p className="eyebrow"><span>04</span> RESOLVED</p>
              <div className="complete-mark">✓</div>
              <h2>Open loops, closed.</h2>
              <p>3件の判断が完了しました。すべての操作にReceiptを残しています。</p>
              <div className="receipt-list">
                {receipts.map((receipt) => (
                  <article key={receipt.id}>
                    <span className={receipt.decision === "Executed" ? "receipt-icon success" : "receipt-icon"}>{receipt.decision === "Executed" ? "✓" : "×"}</span>
                    <div><small>{receipt.decision} · {receipt.createdAt}</small><h3>{receipt.actionTitle}</h3><p>{receipt.result}</p></div>
                    <span className="receipt-executor">{receipt.executor}</span>
                  </article>
                ))}
              </div>
              <div className="completed-proof">
                <span>自動的に除外した完了済みAction</span>
                <strong>{analysis.completedActions[0].title}</strong>
                <p>{analysis.completedActions[0].reason}</p>
              </div>
              <div className="complete-actions">
                {lastSnapshot && <button className="secondary-cta" onClick={undo}>直前の判断を取り消す</button>}
                <button className="primary-cta compact" onClick={reset}>もう一度試す <b>↻</b></button>
              </div>
            </div>
          )}
        </section>
      )}

      {detailOpen && current && (
        <div className="modal-backdrop" role="presentation" onMouseDown={closeDetail}>
          <section ref={detailPanelRef} className="detail-panel" role="dialog" aria-modal="true" aria-label="Actionの根拠と文脈" onMouseDown={(event) => event.stopPropagation()}>
            <header><div><small>ACTION EVIDENCE</small><h2>何を、なぜ行うのか</h2></div><button onClick={closeDetail} aria-label="閉じる">×</button></header>
            <div className="detail-summaries">
              <section>
                <small>TASK SUMMARY</small>
                <h3>どのようなタスクか</h3>
                <p>{taskSummary(current)}</p>
              </section>
              <section>
                <small>CONTEXT SUMMARY</small>
                <h3>どの文脈で生まれたか</h3>
                <p>{contextSummary(current)}</p>
              </section>
            </div>
            <div className="detail-reason"><span>WHY OPEN LOOP INBOX SHOWED THIS</span><p>{current.reconciliationReason}</p></div>
            <div className="evidence-heading"><small>RAW EVIDENCE</small><h3>会話の原文</h3></div>
            <div className="timeline">
              {current.evidence.map((evidence) => (
                <article key={evidence.id}>
                  <span className={`source-icon ${evidence.sourceKind.toLowerCase()}`}>{sourceMarks[evidence.sourceKind]}</span>
                  <div>
                    <small>{evidence.sourceKind} · {evidence.occurredAt}</small>
                    <strong>{evidence.sourceTitle}</strong>
                    <q>{evidence.quote}</q>
                    <span className={`evidence-strength strength-${evidence.strength}`}>{evidenceStrengthLabels[evidence.strength]}</span>
                  </div>
                </article>
              ))}
            </div>
            <div className="payload-preview"><small>EXECUTION PREVIEW</small><strong>{current.executor}</strong><p>{current.effect}</p></div>
          </section>
        </div>
      )}

      {helpOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={closeHelp}>
          <section ref={helpPanelRef} className="help-panel" role="dialog" aria-modal="true" aria-label="操作説明" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={closeHelp} aria-label="閉じる">×</button>
            <span className="help-kicker">HOW TO REVIEW</span>
            <h2>カードの操作方法</h2>
            <p>カードをスワイプするか、カード下のボタン・矢印キーで操作できます。</p>
            <div className="help-list">
              <div><kbd>→</kbd><span><b>Execute — 右スワイプ / Enter</b>表示内容で実行します</span></div>
              <div><kbd>←</kbd><span><b>Dismiss — 左スワイプ</b>今回は対応しない判断を記録します</span></div>
              <div><kbd>↑</kbd><span><b>Add instruction — 上スワイプ</b>推奨候補または自由入力で指示を追加して実行します</span></div>
            </div>
            <p className="help-note">直前の判断はUndoできます。Evidenceを押すと、タスクの要約・発生文脈・原文を確認できます。</p>
          </section>
        </div>
      )}

      <footer className="site-footer"><span>EVERY OPEN LOOP, ONE INBOX.</span><p>Sample data only · No external writes</p></footer>
    </main>
  );
}
