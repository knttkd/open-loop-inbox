# Open Loop Inbox

**Codexの複数スレッドと、取り込んだ会話ログに散らばる未完了の約束を、一つの実行可能なInboxへ。**

Codexで仕事を進めるほど、作業の履歴は増えます。
調査はあるスレッドで始まり、別のスレッドで条件が変わり、取り込んだ会議の文字起こしには共有や返信の約束が残ります。
テストが通り、ファイルが変更され、レポートが作られても、元の約束がすべて満たされたとは限りません。

Open Loop Inboxは、Codex内の複数スレッドを横断し、ユーザーが明示的に取り込んだ文字起こしや外部会話ログも同じAction単位で照合します。
同じ依頼は一つにまとめ、後のスレッドで完了した作業はレビュー対象から外し、変更された条件や人間の承認待ちを反映します。
その結果、ユーザーが今判断すべきActionだけが、一つのInboxに残ります。

## 通常のToDo管理との違い

| 通常のToDo管理 | Open Loop Inbox |
|---|---|
| ユーザーが登録したタスクから始まる | まだタスク化されていない約束を会話から回収する |
| 一つのタスクに書かれた情報を管理する | 複数のCodexスレッドと取り込んだ会話ログを横断して確認する |
| 重複、条件変更、完了状態を人間が更新する | 後続の会話と実行結果を証拠として照合する |
| タスクを表示し、並べ替え、期限を管理する | 承認されたActionをCodexや接続アプリですぐに実行する |
| Doneへの変更で完了を表す | 元の約束、実行結果、残条件をReceiptで結び付ける |

通常のToDoアプリは、登録済みのタスクを整理するところから始まります。
Open Loop Inboxが扱うのは、その前にある会話と、その後にある実行です。
会話に埋もれた約束を見つけ、現在の状態を確認し、残っている部分だけを実行可能な形へ変えます。

各Actionカードには、元の発言、関連するCodexスレッド、完了済みの範囲、残っている条件、承認後に起きる処理が表示されます。
ユーザーはActionを承認、編集、却下し、リサーチ、コード修正、メール下書き、予定の仮作成などを、その場でCodexや接続アプリへ渡せます。
実行結果は**Receipt**として元の約束へ戻り、Commitmentの状態をClosed、Partially closed、Reopenedのいずれかへ更新します。

現在のMVPが直接参照する一次ソースは、Codexのスレッド履歴です。
会議の文字起こしやChatGPTなどの外部会話は、ユーザーが対象を選び、Codexへ明示的に取り込みます。
外部サービスの全履歴を無条件に走査する設計ではありません。

**Recover → Reconcile → Review → Execute → Close**

> Loop Engineering taught agents how to keep working.  
> Open Loop Inbox makes sure the work actually gets closed.

---

## English overview

**Turn open commitments scattered across Codex threads and imported conversations into one executable inbox.**

Work in Codex rarely stays inside a single thread.
A request may begin in one thread, change in another, and remain tied to a follow-up captured in an imported transcript.
A test can pass, a file can change, or a report can be generated while the original commitment is still incomplete.

Open Loop Inbox reviews multiple Codex threads together with conversation records that the user explicitly imports.
It merges duplicate requests, removes work already completed elsewhere, carries forward later changes, and leaves only the actions that still require a decision.

Unlike a traditional todo app, it does not wait for the user to create and maintain every task manually.
It recovers work before it becomes a todo, reconciles its latest state across threads, and lets the user execute the remaining action immediately through Codex or connected apps.

Every action shows its source evidence, completed steps, remaining conditions, and execution preview.
The user can approve, edit, or dismiss it, then receive a receipt that connects the execution result back to the commitment that created the work.

The MVP reads Codex thread history directly.
Meeting transcripts and external conversations, including selected ChatGPT exports, are explicitly imported by the user rather than collected through unrestricted history access.
