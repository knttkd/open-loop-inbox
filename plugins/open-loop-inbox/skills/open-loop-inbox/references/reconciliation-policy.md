# Reconciliation policy

## Evidence precedence

Apply this order from strongest to weakest:

1. Successful Execution Receipt
2. Codex command or file change plus successful verification
3. Explicit user statement that the work is complete
4. Codex completion statement without a verifiable result
5. Intent, request, or plan
6. Time elapsed or conversation stopped

Never mark an Action complete from elapsed time alone.

## Candidate detection

Include explicit commitments, requests, research, replies, scheduling, code work, and deferred decisions. Exclude casual wishes, hypotheticals, vague improvements, and work clearly assigned to someone else.

Exclude the current live-scan operation itself. Listing history, selecting threads, classifying Actions, and saving a Receipt for the current scan are workflow activity, not recovered Open Loops. When the current thread cannot be excluded mechanically, suppress only those scan-operation candidates as `Current scan`; do not surface them as `Ready` or `Unfinished`. Independent user requests in the same thread remain eligible when they have their own outcome and Evidence.

Every Candidate must have at least one original Evidence excerpt. Keep inferred values separate from explicit facts.

## Duplicate grouping

Group candidates only when they share the same outcome and compatible target, owner, and time window. Similar topics with independent deliverables remain separate.

When merging:

- preserve every Evidence excerpt;
- prefer the latest explicit update for due date, quantity, recipient, and target;
- explain why the items are the same Action;
- never hide a conflicting instruction.

## State resolution

- Use `Completed` only with strong completion Evidence.
- Use `Conflict` when equally strong Evidence disagrees on a material field.
- Use `Needs input` when execution requires one missing recipient, date, target, or scope value.
- Use `Ready` only when the effect is specific enough to preview.
- Keep low-confidence Candidates out of the main queue.

## Confidence

Confidence measures Evidence sufficiency, not model certainty.

- **High**: explicit action, owner, target, and source Evidence are present.
- **Medium**: Action is clear but one execution field is missing; use `Needs input`.
- **Low**: wish, inference, ambiguous owner, or insufficient Evidence; suppress from the main queue.
