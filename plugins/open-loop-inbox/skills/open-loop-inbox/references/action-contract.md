# Action and Receipt contract

## Action Proposal

Each proposal must contain:

- `id`: stable identifier derived from the source group
- `title`: concrete action beginning with a verb
- `owner`: explicit owner or `Unknown`
- `due`: explicit value, user-selected value, or `Unknown`
- `type`: `Research`, `Codex task`, `Email draft`, `Calendar hold`, or `Task record`
- `status`: `Ready`, `Needs input`, `Conflict`, `Completed`, `Duplicate`, `Deferred`, or `Dismissed`
- `risk`: `Low`, `Medium`, or `High`, with a short reason
- `confidence`: Evidence sufficiency as a percentage
- `evidence`: source, thread or artifact identifier, timestamp, original excerpt, and evidence kind
- `reconciliationReason`: why items were merged, updated, completed, or shown
- `executionPreview`: executor, target, resulting artifact, external effect, and reversibility
- `missingField`: no more than one question when status is `Needs input`

Do not emit a reviewable proposal without Evidence.

## Approval Decision

Record:

- proposal identifier
- `Approve`, `Dismiss`, `Edit`, or `Snooze`
- decision timestamp
- any user edits
- exact approved execution preview

## Execution Receipt

Record:

- receipt identifier
- proposal identifier and title
- minimal Evidence references containing identifiers only; do not include quotes, excerpts, message text, prompts, or tool output
- approved preview
- final executor and target
- result status and summary
- external artifact identifier when applicable
- completion timestamp
- undo instructions when reversible
- error and partial-success details when applicable

Never store secrets, access tokens, or full conversation transcripts.

Receipt persistence must reject raw-content fields, secret-like values, oversized strings, and oversized payloads. The persisted file must be readable and writable only by the current user.
