import assert from "node:assert/strict";
import test from "node:test";
import { reconcileCandidates } from "../lib/open-loop/reconcile.ts";
import { sampleCandidates } from "../lib/open-loop/sample.ts";

test("reduces the golden sample from seven candidates to three reviews", () => {
  const result = reconcileCandidates(sampleCandidates);

  assert.deepEqual(result.summary, {
    sources: 5,
    candidates: 7,
    merged: 2,
    completed: 1,
    ready: 3,
    lowConfidence: 1,
  });
  assert.equal(result.proposals.length, 3);
  assert.equal(result.completedActions.length, 1);
});

test("keeps provenance when duplicate candidates are merged", () => {
  const result = reconcileCandidates(sampleCandidates);
  const research = result.proposals.find((proposal) => proposal.type === "Research");

  assert.ok(research);
  assert.equal(research.evidence.length, 2);
  assert.equal(research.due, "7月20日（月）");
  assert.match(research.reconciliationReason, /2件を統合/);
});

test("requires input instead of inventing a calendar date", () => {
  const result = reconcileCandidates(sampleCandidates);
  const calendar = result.proposals.find((proposal) => proposal.type === "Calendar hold");

  assert.ok(calendar);
  assert.equal(calendar.status, "Needs input");
  assert.equal(calendar.due, undefined);
  assert.equal(calendar.missingField, "開催日時");
});
