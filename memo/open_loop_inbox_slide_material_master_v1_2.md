# Open Loop Inbox

## 発表用・全網羅素材ドキュメント

> **文書の目的**  
> スライドを作り始める前に、発表で使い得る情報を一度すべて洗い出すためのマスタードキュメント。  
> 本書では、伝えるべき事実・主張・例・比較・メッセージ候補を整理する。スライド枚数や最終構成はまだ確定しない。

| 項目 | 内容 |
|---|---|
| プロジェクト名 | Open Loop Inbox |
| 文書版 | v1.2 |
| 更新日 | 2026年7月18日 |
| 想定発表 | Global Build Week Tokyo / OpenAI Global Build Week |
| 主な更新 | Codexを一次サーフェスに統一。外部会話は明示インポートとし、README、要件定義、発表素材の表現を整合 |

---

# 0. 発表で最終的に伝えたいこと

## 採用する英語ストーリー

> **Loop Engineering taught agents how to keep working.  
> Open Loop Inbox makes sure the work actually gets closed.**

## 採用する日本語ストーリー

> **Loop Engineeringによって、AIは自律的に仕事を続けられるようになった。  
> しかし、複数の人・会話・Agentにまたがる約束は、今も開いたまま残る。  
> Open Loop Inboxは、それらを回収・照合し、人間の判断と実行Receiptによって閉じる。**

## 中心となる洞察

> **エージェントがタスクを完了したことと、そのタスクを生んだ約束が閉じたことは同じではない。**

英語では次の表現が使える。

> **Finishing a task is not the same as closing the commitment.**

または、より簡潔に、

> **Agents finish tasks. Open Loop Inbox closes the work.**

## 一文のプロダクト説明

> **Codex内の複数スレッドと、取り込んだ会話ログに散らばった未完了のCommitmentを回収、照合し、今判断すべきActionだけを一つの実行キューとして提示する。**

## 一文の差別化

> **通常のToDoは登録済みタスクを管理する。Open Loop Inboxは、Codexの複数スレッドと取り込んだ会話ログを照合し、まだ必要なActionだけを残して実行へ渡す。**

---

# 1. プロダクトの基本定義

## 1.1 プロダクト名

**Open Loop Inbox**

## 1.2 Open Loopとは

人やAIとの会話の中で生まれたものの、まだ次のいずれにも整理されていない約束・依頼・判断・作業を指す。

- 完了した
- 却下した
- 保留した
- 他者へ委任した
- 条件変更を反映した
- 実行結果を確認した

例：

- 「あとでこの技術を調べよう」
- 「佐藤さんに返信しておこう」
- 「この機能にテストを追加する」
- 「来週、田中さんと話そう」
- 「この案を比較してから決める」
- 「実装後にレビューを依頼する」

## 1.3 なぜ“Loop”なのか

Open Loop Inboxの“loop”には、三つの意味が重なっている。

### A. 未完了のコミットメント

何かを「やる」と決めた瞬間に仕事は始まる。しかし、その約束が完了・却下・保留のいずれにも整理されない限り、認知的には開いたまま残る。

### B. 実行と結果のフィードバック

仕事は、指示を出して終わりではない。

```text
約束が生まれる
  ↓
実行する
  ↓
結果を確認する
  ↓
元の約束を満たしたか判断する
  ↓
Close / Reopen
```

結果が元の約束へ戻り、状態が更新されて初めてloopが閉じる。

### C. Loop Engineering時代の外側のloop

Loop Engineeringは、Agentが一つの仕事を実行・検証・反復する内側のloopを強くする。Open Loop Inboxは、その周囲にある、人・会話・複数Agentをまたぐ約束のライフサイクルを扱う。

## 1.4 名前の直接的な由来

この名称は、最近のLoop Engineeringという言葉へ便乗して付けたものではない。直接的には「未完了の約束＝open loopを受け取るInbox」という意味である。

ただし結果として、現在のLoop Engineeringの潮流と自然に接続できる。

> **Loop Engineering closes the inner execution loop.  
> Open Loop Inbox closes the outer commitment loop.**

## 1.5 サブタイトル候補

### 最も分かりやすい

> **Close unfinished commitments across Codex threads and imported conversations.**

### 横断性を強調

> **From scattered conversations to one trusted execution queue.**

### Loop Engineeringとの関係を強調

> **The commitment layer for human–AI work.**

### 日本語

> **Codexの複数スレッドと、取り込んだ会話ログに散らばった「やり残し」を閉じる。**

---

# 2. Loop Engineeringとの関係

## 2.1 Loop Engineeringが解いたこと

Loop Engineeringは、Agentが単発の応答で止まらず、目標へ向けて継続的に仕事を進めるための考え方である。

```text
Plan
  ↓
Execute
  ↓
Verify
  ↓
Learn / Retry
  ↓
Complete
```

これによりAgentは、たとえば次のような仕事を完了状態まで進められる。

- テストが通るまでコードを修正する
- 必要なファイルを変更する
- 調査を行い、レポートを完成させる
- エラーを検出し、再試行する
- 完了条件を満たすまで作業を続ける

## 2.2 Loop Engineeringだけでは見えにくい外側の問題

現実の仕事は、一つのAgent、一つのCodexスレッド、一つの明確なタスクから始まるとは限らない。

開始すべき仕事そのものが、次の場所へ散らばっている。

- Codex thread A
- Codex thread B
- Codexへ取り込んだ会議の文字起こし
- Codexへ取り込んだ外部会話ログ
- 人間によるレビューと承認
- 接続アプリの実行結果

そこには、同じ依頼、変更された条件、Executionだけが終わった作業、共有や返信を待つCommitmentが混在している。

## 2.3 正確なポジショニング

次の表現は避ける。

> Loop Engineeringにはloopを閉じる仕組みがない。

Loop Engineeringは、Execution Loopを完了させる仕組みを含むため、この説明は不正確である。

代わりに、次のように表現する。

> **Loop Engineeringは、一つのExecution Loopを完了へ進める。  
> Open Loop Inboxは、複数のExecution Loopを生んだCommitmentを横断的に整理し、本当に閉じたかを確認する。**

## 2.4 内側と外側

### Inner Loop

Agentが実際の作業を実行・検証・再試行する。

### Outer Loop

人間の目的、約束、優先順位、承認、外部への反映を管理する。

Open Loop InboxはOuter Loopを製品化する。ただし、単なる承認画面ではない。複数のCodexスレッドと、ユーザーが取り込んだ会話ログからCommitmentを回収し、重複、変更、完了状態を照合してから、人間へ判断を返す。

## 2.5 発表用の接続文

> **Loop Engineering made agents better at finishing tasks.  
> But our work does not begin inside one agent. It begins across many conversations.**

日本語：

> **Loop Engineeringによって、Agentは一つの仕事を完了まで進められるようになった。  
> しかし、現実の仕事は一つのAgentの中ではなく、複数のCodexスレッドと取り込んだ会話ログから始まる。**

---

# 3. Execution LoopとCommitment Loop

## 3.1 Execution Loop

Agentへ与えられた個別作業を完了させるloop。

```text
Task
  ↓
Plan
  ↓
Execute
  ↓
Verify
  ↓
Complete
```

### 完了を示す代表例

- テストが通った
- ファイルを変更した
- Pull Requestを作成した
- 指定された調査レポートを作った
- API呼び出しが成功した
- 指定されたドキュメントを更新した

### 中心となる問い

> **Agentは与えられたタスクを完了したか？**

## 3.2 Commitment Loop

人間やAIとの会話から生まれた、より上位の約束や意図が、本当に満たされたかを管理するloop。

```text
Conversation
  ↓
Commitment
  ↓
One or more executions
  ↓
Human decision / External response
  ↓
Outcome verification
  ↓
Closed
```

### 完了前に確認すべきこと

- 元の約束は本当に満たされたか
- 別の会話に同じ依頼がないか
- 条件が後から変更されていないか
- 担当者は正しいか
- 人間の承認が終わったか
- 相手への返信・共有まで完了したか
- 結果が実際のプロジェクトへ反映されたか
- 失敗・差し戻しによって再度Openになっていないか

### 中心となる問い

> **その仕事を生んだ約束は、本当に閉じたか？**

## 3.3 両者の違い

| 観点 | Execution Loop | Commitment Loop |
|---|---|---|
| 問い | 指示された作業を完了したか | 元の約束や目的を満たしたか |
| 主な主体 | 一つのAgent | 人間、複数Agent、関係者 |
| 範囲 | 一つのタスクやスレッド | 複数のCodexスレッド、取り込んだ会話ログ、接続ツールの実行結果 |
| 完了証拠 | テスト、変更ファイル、成果物 | 元の意図、後続会話、人間の承認、外部への反映 |
| 典型的な問題 | 実行失敗、検証失敗 | 重複、条件変更、承認待ち、共有漏れ |
| Open Loop Inboxの役割 | 完了結果を証拠として利用する | 回収・照合・判断・closureを管理する |

## 3.4 最も重要な主張

> **Agents can complete tasks without closing the commitment that created them.**

日本語：

> **エージェントはタスクを完了できる。  
> しかし、そのタスクを生んだ約束まで閉じたとは限らない。**

---

# 4. 課題：仕事は消えていない、散らばっている

## 4.1 中心課題

Codexで仕事を進めるほど、スレッドは増える。

あるスレッドで調査を始め、別のスレッドで条件を変え、さらに別のスレッドで実装とテストを行う。
会議の文字起こしや外部チャットをCodexへ取り込めば、返信、共有、承認といった約束も同じ作業空間へ入る。

しかし、スレッドの履歴は自動的に一つのCommitmentへまとまらない。

> **問題は、何を話したかではない。何がまだ閉じていないかが分からないことにある。**

## 4.2 具体的な摩擦

| 摩擦 | 起きていること | 結果 |
|---|---|---|
| 発見 | 複数のCodexスレッドと取り込んだログを一つずつ開く | 未完了事項を見落とす |
| 照合 | 同じ依頼が別の表現で重複する | 古い条件と重複ToDoが残る |
| 状態 | テストは通ったが、共有や承認は終わっていない | Execution完了をCommitment完了と取り違える |
| 判断 | 候補が多く、根拠と影響を一件ずつ確認する | レビュー自体が新しい仕事になる |
| 実行 | 残作業を別のツールへ再入力する | 把握しただけで仕事が進まない |

## 4.3 問題を表す短い言葉

> **Your work is not lost. It is scattered across Codex threads and imported conversations.**

日本語：

> **仕事は消えていない。Codexのスレッドと取り込んだ会話の中に散らばっている。**

# 5. Why Now：なぜ今必要なのか

## 5.1 AIとの会話が仕事の入口になった

以前は、仕事の指示や意思決定が会議、メール、タスク管理ツールに集中していた。

現在は、Codexの複数スレッドで次の作業が並行して進む。

- あるスレッドで企画を調べる
- 別のスレッドで実装する
- さらに別のスレッドで修正条件を追加する
- 会議の文字起こしや外部会話をCodexへ取り込む
- 実行結果を見て、新しい約束を作る

Codexのスレッドそのものが、仕事の発生源であり、Executionの証拠にもなっている。

## 5.2 Agentが増えるほど、Commitmentの管理が難しくなる

Agentは多くの成果物を速く作れる。

しかし、それに伴って増えるものもある。

- 会話数
- 実行結果
- フォローアップ
- 承認待ち
- 条件変更
- 部分完了

> **生成能力が高まるほど、何を続け、何を止め、何が本当に閉じたかを管理する層が必要になる。**

## 5.3 “増やすAI”から“閉じるAI”へ

多くのAIは、

- テキストを増やす
- 案を増やす
- タスク候補を増やす
- 実行を増やす

方向へ働く。

Open Loop Inboxは逆に、

- 重複を減らす
- 完了済みを消す
- 判断対象を減らす
- 残っている部分だけを示す
- 最後のclosureまで進める

ことを価値にする。

---

# 6. 対象ユーザー

## 6.1 主な対象

- Codexを日常的に使う個人開発者
- ファウンダー
- プロダクトマネージャー
- クリエイター
- フリーランス
- 小規模チームのテックリード

## 6.2 共通する特徴

- 一つのプロジェクトで複数のCodexスレッドを使う
- 複数のCodexスレッドと取り込んだ会話ログを往復する
- 企画、調査、実装を並行する
- タスク管理ツールへの手動転記を後回しにする
- 「後でやる」と話したことが抜ける
- 同じことを複数のAgentへ依頼する
- 実行完了と最終的な業務完了の差に悩む

## 6.3 Jobs to Be Done

### 一日の終わり

> 今日のCodexスレッドと取り込んだ会話ログを読み返さず、残っているCommitmentだけ確認したい。

### 週次レビュー

> 複数プロジェクトの会話に散らばった未処理事項を、短時間で整理したい。

### 会議後

> 取り込んだ会話で依頼した実装が、別のCodexスレッドでどこまで完了したか確認したい。

### 作業再開時

> 数日前のチャットをすべて読み返さず、次に何をすべきか把握したい。

### Agent活用時

> Agentが作業を終えた後、元の依頼のどこまで満たされ、何が人間の判断待ちか知りたい。

---

# 7. 提供価値

Open Loop Inboxは、次の五段階を一つの体験にまとめる。

```text
Recover
  ↓
Reconcile
  ↓
Decide
  ↓
Execute
  ↓
Receipt / Close
```

## 7.1 Recover：回収する

Codexの複数スレッドと、ユーザーが明示的に取り込んだ文字起こしや外部会話ログから、未完了のCommitment候補を集める。

### ユーザー価値

- どこで話したかを覚えなくてよい
- 各チャットを一つずつ開かなくてよい
- ToDoへ手動転記しなくてよい

## 7.2 Reconcile：照合する

候補について、

- 同じCommitmentを統合する
- 元のCommitmentがClosedになった候補を除外する
- Executionだけが完了している場合は、残条件を次のActionとして残す
- 後の会話で変更された条件を反映する
- 複数の実行結果を元のCommitmentへ結び付ける
- 残っている部分だけを抽出する
- 矛盾や情報不足を見つける

### ユーザー価値

- 大量の候補ではなく、本当に確認すべき少数だけを見る
- 完了済みの作業を再確認しなくてよい
- 同じ作業を重複して管理しなくてよい

## 7.3 Decide：判断する

Actionを一枚のカードで提示し、ユーザーが高速に判断する。

カードには、

- 何をするか
- 元の約束は何か
- どの会話から見つかったか
- どこまで完了しているか
- 実行すると何が起きるか
- 情報が足りているか
- リスクがあるか

を表示する。

### ユーザー価値

- 長い会話を読み返さずに判断できる
- AIの根拠を確認できる
- 実行、編集、却下、保留を短時間で決められる

## 7.4 Execute：実行する

承認されたActionをCodexや接続アプリが実行する。

例：

- Codexでリサーチする
- コード修正を続ける
- レビュー依頼を作る
- メールの下書きを作る
- カレンダーに仮予定を作る
- 調査結果を共有用ドキュメントへまとめる

## 7.5 Receipt / Close：証拠によって閉じる

実行結果を、元のCommitmentへ結び付ける。

Receiptには、

- 元の約束
- 承認したAction
- 実行した内容
- 実行結果
- まだ残っている条件
- Closed / Partially closed / Reopened

を含める。

### ユーザー価値

- 「実行した」だけでなく「何が閉じ、何が残ったか」が分かる
- 次回同じタスクが再表示されにくい
- Agentへ任せてもコントロールと説明可能性を保てる

---

# 8. Commitmentが閉じていない具体例

## 8.1 コード変更は完了したが、レビュー依頼が残る

### 元の会話

> 提出前にエラーハンドリングを追加して、レビューをお願いしよう。

### Execution Loopの結果

- コード変更：完了
- テスト：完了
- Commit：完了

### Commitment Loopの状態

- レビュー依頼：未完了

Open Loop Inboxは、元のタスクをもう一度表示しない。

> **残り：Pull Requestを作成し、レビューを依頼する**

と更新する。

## 8.2 レポート作成は完了したが、共有が残る

### 元の会話

> Cursorの最近の受賞事例を5件調べて、月曜日までにチームへ共有しよう。

### Execution Loopの結果

- 調査：完了
- レポート生成：完了

### Commitment Loopの状態

- チームへの共有：未完了

Open Loop Inboxは、

> **残り：完成したレポートをチームへ共有する**

と提示する。

## 8.3 メール下書きは完了したが、返信は閉じていない

### 元の会話

> 佐藤さんへ、企画書に問題がないと今日中に返しておこう。

### Execution Loopの結果

- 宛先特定：完了
- 返信文生成：完了
- Gmail下書き：完了

### Commitment Loopの状態

- 人間の承認：未完了
- 送信：未完了

状態は“失敗”ではなく、

> **Ready for approval**

となる。

## 8.4 複数のCodexスレッドと取り込んだログが、一つのCommitmentを構成する

### 外部会話ログ

> Cursorのハッカソン事例をもっと調べたい。

### 取り込んだ会議の文字起こし

> 最近の受賞作を5件、月曜までに共有しよう。

### Codex thread A

> 受賞事例7件を調査し、レポートを作成しました。

### Codex thread B

> 共有用の要約とリンク一覧はまだ作成していません。

### Open Loop Inboxの照合

```text
外部会話で生まれた意向
＋
会議で具体化された件数と期限
＋
Codexで完了した調査
＋
別スレッドに残った共有作業
＝
調査は完了、共有は未完了
```

一つのCommitmentとして統合し、残っている共有ActionだけをInboxへ出す。

# 9. 状態モデル

Open Loop Inboxは、単純なDone / Not Doneだけを扱わない。

| 状態 | 意味 |
|---|---|
| Open | 約束は検出されたが未処理 |
| In progress | AgentがExecution Loopを実行中 |
| Ready for approval | Agent側の作業は終わり、人間の判断待ち |
| Needs input | 実行に必要な情報が不足 |
| Partially closed | 約束の一部だけが完了 |
| Closed | 元のCommitmentを満たす証拠が揃った |
| Dismissed | 人間が実行不要と判断 |
| Reopened | 条件変更、失敗、差し戻しで再対応が必要 |

## 9.1 特に重要な状態：Partially closed

この状態が、単純なToDo抽出との差を最もよく表す。

- レポートは完成したが共有していない
- コードは修正したがレビュー依頼していない
- メール下書きはあるが送信していない
- 予定候補はあるが相手が承認していない

Open Loop Inboxは「完了」か「未完了」かを乱暴に決めず、残っている部分だけを次のActionへ変換する。

---

# 10. Before / After

| Before | After |
|---|---|
| 複数のCodexスレッドと取り込んだ会話ログを個別に検索する | 未完了のCommitmentが一つのInboxに集まる |
| 同じ依頼が重複して見つかる | 一つのCommitmentへ統合される |
| 完了済みか別スレッドで確認する | Codexの結果から完了証拠を照合する |
| Agentの“成功”をそのまま完了とみなす | 元の約束を満たしたかを確認する |
| ToDo名だけを保存する | 実行可能なActionと残作業が提示される |
| 各アプリを開いて再入力する | 承認するとCodexや接続アプリが実行する |
| 実行結果が散らばる | Receiptが元のCommitmentへ結び付く |
| AIの判断根拠が分からない | 元発言、統合理由、完了証拠が表示される |

---

# 11. UXの中心：Approval Inbox

## 11.1 なぜInboxなのか

ユーザーは毎回AIへ、

> 全履歴から未完了事項を探して

とプロンプトしたくない。

必要なのは、未処理のCommitmentが定期的に集まり、短時間で判断できる場所である。

## 11.2 なぜスワイプなのか

スワイプはTinder風の演出が目的ではない。

> **Agentが生成した複数の実行案を、チャットで一件ずつ確認せず、高速にレビューするための操作モデル。**

| 操作 | 意味 |
|---|---|
| 右スワイプ | 承認して実行 |
| 左スワイプ | 却下 |
| 上スワイプ | 編集または追加情報を入力 |
| タップ | 元の会話・判断理由・完了証拠を確認 |
| Undo | 直前の判断を取り消す |

マウスやアクセシビリティのため、同じ意味のボタンも配置する。

## 11.3 カードに表示する情報

### 表面

- 次に行うAction
- 元のCommitment
- 現在の状態
- 実行先
- 実行すると何が起きるか
- 最も強いEvidence
- Risk
- 「2件を統合」「一部完了」などの照合結果

### 詳細

- 元の発言
- 発言元の会話
- 後続の変更
- Codexの完了証拠
- 複数ソースを統合した理由
- まだ残っている条件
- 実際に承認する内容

## 11.4 One Question, Not a Chat

不足情報を補うために長いチャットを始めない。

例：

> 田中さんとのMTGはいつにしますか？

- 火曜日14時
- 水曜日11時
- 自分で選ぶ

一問でActionを実行可能にする。

---

# 12. このプロダクトの見せ場

## 12.1 “見つけた数”ではなく“減らした数”

デモでは次の変化を見せる。

> 5 conversations analyzed  
> 7 action candidates found  
> 2 duplicates merged  
> 1 execution already completed  
> 1 commitment partially closed  
> **3 actions ready for human review**

重要なのは、7件を抽出したことではない。

> **7件の候補を、人間が本当に判断すべき3件まで減らしたこと。**

## 12.2 Agentの成功とCommitmentのclosureを分けて見せる

例：

```text
Test passed                       ✓
Files changed                     ✓
Report generated                  ✓
Human approval                    Pending
External delivery                 Pending
Original commitment               Still open
```

この対比によって、プロダクトの必然性が一瞬で伝わる。

## 12.3 Receiptで閉じる

通常のツール実行結果：

> ファイルの更新に成功しました。

Open Loop InboxのReceipt：

> 元の約束：エラーハンドリングを追加し、レビューを依頼する  
> 完了：コード変更、テスト、Pull Request作成、レビュー依頼  
> 結果：Commitment closed

Receiptは成功通知ではなく、元の約束を閉じるための証拠である。

---

# 13. 競合・代替手段との違い

## 13.1 会議文字起こし・議事録ツール

### 得意なこと

- 一つの会議を記録する
- 要約する
- Action itemを抽出する

### Open Loop Inboxとの差

- 別のCodexスレッドで条件が変わったか確認する
- Codexで既に実装済みか確認する
- 別の会議にある同じ依頼を統合する
- 成果物作成後の共有・承認まで追う

> **会議ツールは会議内のActionを記録する。Open Loop Inboxは、そのActionがCodexで進んだ後もCommitmentを追跡する。**

## 13.2 Ambient recorder / ライフログ

### 得意なこと

- 日常会話を取得する
- 記録、要約、リマインダーを作る

### Open Loop Inboxとの差

録音は入力ソースの一つにすぎない。中心価値は、取り込んだ文字起こしとCodexの複数スレッドを横断し、Commitmentの状態を照合することにある。

## 13.3 ChatGPTの履歴検索・Memory

### 得意なこと

- 過去の情報を思い出す
- 関連する会話を参照する

### Open Loop Inboxとの差

必要なのは「何を話したか」ではなく、

- まだ未完了か
- 重複しているか
- 後から変更されたか
- 今判断すべきか
- closureの証拠があるか

を整理した監査可能なActionキューである。

> **Search finds what you said. Open Loop Inbox finds what is still unfinished.**

## 13.4 タスク管理ツール

### 得意なこと

- 確定済みのタスクを管理する
- 期限、担当、進捗を追う

### Open Loop Inboxとの差

Open Loop Inboxは、その前段階を担当する。

> 会話に埋もれ、まだタスクとして確定していないCommitmentを回収・照合するInbox。

タスク管理ツールを置き換えるのではなく、そこへ渡す前の判断層になる。

## 13.5 自動化・Agent基盤

### 得意なこと

- 明確な指示を実行する
- 反復し、Execution Loopを完了する

### Open Loop Inboxとの差

- 何を実行すべきかが複数のCodexスレッドと取り込んだ会話ログへ分散している
- 同じ依頼が重複している
- 一部だけ完了している
- 人間の承認が必要である

という外側の問題を扱う。

## 13.6 差別化の一文

> **Existing tools capture conversations or execute tasks.  
> Open Loop Inbox reconciles the commitment between them.**

日本語：

> **既存ツールは会話を記録するか、明確なタスクを実行する。  
> Open Loop Inboxは、その間にある約束を照合し、閉じる。**

---

# 14. Why Codex

## 14.1 Codexは情報源である

Codexのスレッドには、

- 何を依頼されたか
- 何を実装したか
- 何を変更したか
- テストが成功したか
- 何が未完了になったか

が残る。

Codex履歴は単なるチャットログではなく、Execution Loopの状態を示すEvidenceになる。

## 14.2 Codexは完了証拠を持つ

会議で、

> エラーハンドリングを追加する

というCommitmentが生まれた後、Codexでコード変更とテストが完了していれば、それを部分完了または完了の証拠にできる。

一般的な文字起こしツールからは、この後続状態が見えない。

## 14.3 Codexは残りの仕事を実行できる

未完了と判断したActionについて、Codexはそのまま、

- コードを修正する
- テストを追加する
- 調査を続ける
- ドキュメントを更新する
- レビュー依頼用の内容を準備する

ことができる。

## 14.4 Codexは履歴と実行を一つのloopにできる

```text
Codexの過去履歴を読む
  ↓
Commitmentの状態を判断する
  ↓
人間が承認する
  ↓
Codexが実行する
  ↓
結果が新しいEvidenceになる
  ↓
次回の解析でClose / Reopenを判断する
```

## 14.5 CodexはReceiptを作れる

実行後に、

- どのCommitmentが根拠だったか
- 何を承認したか
- 何を変更したか
- どの検証が通ったか
- 何がまだ残っているか

を結び付けられる。

## 14.6 Codexは開発ツールではなく、プロダクトの構成要素

> **Codex is not only how we built it.  
> Codex is the source, execution engine, and evidence layer of the product.**

日本語：

> **Codexは開発に使っただけではない。  
> 過去の仕事を読み、続きを実行し、完了証拠を残すプロダクトの中心である。**

## 14.7 主張しすぎないための表現

避ける：

> Codexでなければ絶対に作れない。

推奨：

> **Codexの履歴と実行環境が同じ場所にあるため、開発作業のCommitmentを検出・実行・検証するloopを、短時間で一つの製品体験にできた。**

---

# 15. 信頼性と安全性

## 15.1 Evidence-first

AIの確信度だけを信じさせない。

すべてのActionに、

- 元の発言
- 発言元
- 日時
- 後続の変更
- 完了証拠
- AIがそう判断した理由

を表示する。

## 15.2 Preview before Effect

承認前に、何が起きるかを具体的に表示する。

例：

> Gmailに下書きを作成します。メールはまだ送信されません。

> カレンダーに仮予定を作成します。参加者への招待はまだ送信されません。

> Codexが指定されたリポジトリでテストを追加します。

## 15.3 リスクに応じた実行

| リスク | 例 | 扱い |
|---|---|---|
| 低 | リサーチ、個人メモ、コード調査 | 一度の承認で実行 |
| 中 | メール下書き、仮予定、Pull Request準備 | Draft / Tentativeまで |
| 高 | メール送信、購入、公開投稿、削除 | MVPでは自動実行しない、または再承認 |

## 15.4 ReceiptとUndo

実行後には、

- 実行した内容
- 実行先
- 実行時刻
- 元のCommitment
- 実行結果
- 残っている条件
- 取り消し方法

を表示する。

## 15.5 人間をloopへ戻す

Open Loop Inboxは、すべてを自動実行するためのプロダクトではない。

> **AIが閉じられる部分を進め、人間が判断すべき部分だけをInboxへ戻す。**

---

# 16. プライバシー

複数のCodexスレッドと、ユーザーが選んだ会話ログを扱うため、プライバシーは周辺要件ではなく中心価値の一部である。

## 基本方針

- 対象にする会話をユーザーが選べる
- 会議文字起こしやChatGPTエクスポートなどの外部会話ログは、MVPでは明示的にインポートする
- 無条件に全履歴を走査しない
- 各Actionに情報源を表示する
- 外部操作の前に承認する
- 不要な候補は却下・削除できる
- 公開デモはサンプルデータを使う

## 発表用表現

> **We do not ask AI to remember everything.  
> We ask it to show the evidence for every action.**

日本語：

> **すべてを記憶させるのではない。  
> Actionごとに根拠を示させる。**

---

# 17. 製品の二つの体験面

## 17.1 Codex版

製品本体。

Codexが一次サーフェスであり、会議やChatGPTは独立したライブ接続先ではなく、ユーザーが明示的に取り込む会話ログとして扱う。

- Codexの実履歴を利用する
- 選択した文字起こしや外部会話ログを取り込む
- 実際のCommitmentを照合する
- Codexでリサーチやコード作業を実行する
- 接続済みサービスでは安全な範囲のActionを行う
- 実行結果をReceiptとして戻す

## 17.2 公開デモサイト

審査員がセットアップなしで価値を体験するJudge Sandbox。

- Codexスレッド、文字起こし、外部会話ログのサンプルを内蔵する
- 重複統合、完了判定、部分完了、情報不足を再現する
- スワイプUIを体験できる
- 外部サービスは安全なモックで示す
- Receiptまで確認できる

## 17.3 発表上の位置づけ

> **Codex版は、実際の仕事を閉じる製品本体。  
> デモサイトは、その判断体験を誰でもすぐ試せるサンドボックス。**

---

# 18. デモで見せるストーリー候補

## 18.1 入力ソース

- Codex thread A
- Codex thread B
- Codex thread C
- Imported meeting transcript
- Imported conversation log

## 18.2 解析結果

> 5 conversations analyzed  
> 7 action candidates found  
> 2 duplicates merged  
> 1 execution already completed  
> 1 commitment partially closed  
> **3 actions ready for review**

## 18.3 ケースA：複数ソースを統合

> Cursorの最近のハッカソン受賞事例を5件調査する  
> 外部会話ログと文字起こしの2件を統合  
> 期限：月曜日  
> 実行先：Codex Research

## 18.4 ケースB：Executionは完了、Commitmentは部分完了

> 調査レポートはCodexで完成済み  
> 残り：チームへ共有

## 18.5 ケースC：人間の承認待ち

> 佐藤さんへの返信下書きは完成済み  
> 残り：内容を確認し、送信する

## 18.6 ケースD：情報不足

> 田中さんとの30分MTG  
> 日時が不足  
> 一問だけ確認

## 18.7 最終画面

> Today’s open loops  
> Closed: 2  
> Partially closed: 1  
> Dismissed: 1  
> Needs input: 0

---

# 19. ユーザーにとっての成果

## 19.1 機能的価値

- 未完了事項を探す時間が減る
- 抜け漏れが減る
- 重複タスクが減る
- 完了済み作業の再確認が減る
- Agentの部分完了を正しく扱える
- AI提案のレビューが速くなる
- 把握から実行、closureまでつながる

## 19.2 感情的価値

- 「何か忘れている気がする」という不安を減らす
- 複数のチャットを閉じても安心できる
- 一日の仕事を本当に閉じた感覚を得られる
- Agentへ任せながらもコントロールを失わない

## 19.3 戦略的価値

- Codexスレッドと取り込んだ会話ログを、実行可能で追跡可能な仕事の履歴へ変える
- Agent利用が増えるほど価値が高まる
- Codexの作業履歴、外部会話ログ、タスク管理の間をつなぐ
- 将来的に個人やチームの“Commitment Inbox”になり得る

---

# 20. 成功を示す指標候補

現時点では実績値ではなく、検証対象またはMVP目標。

| 指標 | 意味 |
|---|---|
| Review Reduction Rate | 候補から重複・完了を除き、レビュー件数をどれだけ減らしたか |
| Action Precision | 表示したActionのうち、本当に有用だった割合 |
| Commitment Closure Rate | 検出したCommitmentのうちClosedまで到達した割合 |
| Partial Closure Accuracy | 部分完了を正しく判定できた割合 |
| Decision Time | 一枚のカードを判断するまでの時間 |
| Evidence Coverage | 根拠を確認できるActionの割合 |
| Execution Completion | 承認したActionが実行結果まで到達した割合 |
| False Execution | 承認内容と異なる操作が起きた件数 |
| Open Loops Resolved per Minute | 1分間で何件のOpen Loopを処理できたか |

---

# 21. 発表メッセージ候補

## 21.1 課題

> **Your work is not lost. It is scattered.**

> **AI made work faster—and open loops harder to track.**

> **The problem is not remembering what you said. It is knowing what is still unfinished.**

## 21.2 ExecutionとCommitmentの差

> **Finishing a task is not the same as closing the commitment.**

> **A test can pass while the work remains open.**

> **A report can be generated while the promise to share it remains open.**

## 21.3 解決策

> **One inbox for every open loop across people and AI.**

> **From conversation history to a trusted execution queue.**

> **We recover the commitment, reconcile the evidence, and close the work.**

## 21.4 差別化

> **We do not extract more tasks. We reduce them.**

> **Search finds what you said. Open Loop Inbox finds what is still unfinished.**

> **Existing tools capture conversations or execute tasks. We reconcile the commitment between them.**

## 21.5 Why Codex

> **Codex knows what you asked, what it completed, and what remains.**

> **Codex is not just the builder. It is the evidence and execution layer of the product.**

> **Open Loop Inbox connects Codex execution back to the human commitment that created it.**

## 21.6 クロージング

> **Loop Engineering taught agents how to keep working.  
> Open Loop Inbox makes sure the work actually gets closed.**

---

# 22. 想定質問と回答素材

## 「これは単なるToDo抽出では？」

> ToDoを抽出するだけではありません。複数のCodexスレッドと取り込んだ会話ログを照合し、重複を統合します。元のCommitmentがClosedなら除外し、Executionだけが完了している場合は、残っている条件だけを次のActionとして提示します。

## 「Loop Engineeringと何が違う？」

> Loop Engineeringは、一つのExecution Loopを完了へ進めます。Open Loop Inboxは、複数のExecution Loopを生んだCommitmentを回収・照合し、元の約束が本当に閉じたかを管理します。

## 「既存の会議AIでよいのでは？」

> 会議AIは、一つの会議の記録とAction抽出に強いです。Open Loop Inboxは、取り込んだ会議ログをCodexの複数スレッドと照合し、実装、承認、共有のどこまで終わったかを更新します。

## 「タスク管理ツールでよいのでは？」

> タスク管理ツールは、タスクとして確定した後を管理します。このプロダクトは、まだタスク化されていない会話上のCommitmentを回収し、登録前に整理するInboxです。

## 「なぜスワイプなのか？」

> Agentが多くの提案を作る時代には、生成よりレビューがボトルネックになります。スワイプは、Actionをチャットで一件ずつ確認せず、高速に承認・却下するための操作です。

## 「AIが勝手に実行するのは危険では？」

> 元のCommitment、実行内容、実行先、影響を表示し、人間が承認してから実行します。高リスク操作は自動実行せず、下書きや仮作成を基本にします。

## 「なぜCodexなのか？」

> Codexは、何を依頼され、何を実装し、どの検証が通ったかを知っています。そして残りの作業をそのまま実行できます。履歴、実行、Evidenceが同じ場所にあるため、Commitmentを閉じるloopを作れます。

## 「完了判定を間違えたら？」

> 完了と判断したEvidenceを表示し、人間が確認できます。ClosedだけでなくPartially closedやReopenedも扱い、無理に二値化しません。

## 「会議やChatGPTの履歴へ自動アクセスするのか？」

> MVPが直接参照する一次ソースはCodex履歴です。会議文字起こしやChatGPTエクスポートなどの外部会話は、ユーザーが対象を確認して明示インポートします。外部サービスの全履歴を無条件に走査しません。

## 「Receiptは単なるログでは？」

> 通常のログはツールの成功を示します。Receiptは、元のCommitment、承認内容、実行結果、残条件を結び付け、ClosedかPartially closedかを示す完了証拠です。

---

# 23. 発表で避ける表現

## 不正確

> Loop Engineeringにはloopを閉じる仕組みがない。

### 代替

> Loop EngineeringはExecution Loopを閉じる。Open Loop Inboxは、その周囲にあるCommitment Loopを閉じる。

## 強すぎる

> 世の中にOpen Loopを管理する製品は存在しない。

### 代替

> Codexの複数スレッドと明示インポートされた会話ログを横断し、重複、部分完了、条件変更を一つのCommitmentとして照合する層は、現在も分断されている。

## 誤解を招く

> Codexが完了と言えば完了。

### 代替

> Codexの実行結果、テスト、変更、後続会話、人間の承認をEvidenceとして照合する。

## 危険に聞こえる

> AIがすべての約束を自動的に閉じる。

### 代替

> AIが閉じられる部分を進め、人間が判断すべき部分だけをInboxへ戻す。

## 誇張

> Codexでなければ作れない。

### 代替

> Codexの履歴・実行・検証を同じ環境で扱えるため、この体験を自然に閉ループ化できた。

---

# 24. 素材の優先度

本書は全量素材であり、すべてを本番スライドへ入れる必要はない。

## 必須候補

- 採用ストーリー
- Execution LoopとCommitment Loopの差
- 「タスク完了≠約束のclosure」
- 複数のCodexスレッドと取り込んだ会話ログへ散らばる問題
- Recover → Reconcile → Review → Execute → Receipt → Close
- 7候補を3件へ減らす見せ場
- Why Codex
- 実際のスワイプデモ
- 最後のReceipt / Closed状態

## 補強候補

- Why Now
- 競合カテゴリ比較
- Partially closedの状態
- プライバシー
- Before / After
- 対象ユーザー

## 質疑用候補

- 詳細な状態モデル
- 指標
- 外部会話ログの明示インポートという制約
- 高リスク操作の境界
- Loop Engineeringとの厳密な差
- タスク管理ツールとの共存

---

# 25. 次の取捨選択で決める論点

| 論点 | 主な選択肢 |
|---|---|
| 冒頭の主語 | Loop Engineering / AI時代の仕事の分散 / 個人の具体的な失敗体験 |
| 最重要課題 | 抜け漏れ / 重複 / 部分完了 / 承認・共有の残り |
| 主人公 | 個人開発者 / ファウンダー / AIを多用する知的労働者 |
| メイン具体例 | コード修正＋レビュー / 調査＋共有 / メール下書き＋送信 |
| 競合説明 | カテゴリ比較を1枚 / 一言のみ / 質疑へ回す |
| Why Codexの比重 | 独立メッセージ / デモ中に説明 / クロージングに統合 |
| 安全性 | カード内で見せる / 1メッセージだけ / 質疑用 |
| 最終メッセージ | “Close the commitment” / “Reduce the review queue” / “Outer loop for human–AI work” |

---

# 26. 発表素材としての確定版パラグラフ

## 英語

> **Loop Engineering taught agents how to keep working.  
> But real commitments are scattered across Codex threads, imported conversations, people, and connected apps.  
> A test may pass, a file may change, or a report may be generated while the original commitment remains open.  
> Open Loop Inbox recovers and reconciles those commitments, brings the remaining decisions back to the human, and closes them with execution receipts.**

## 日本語

> **Loop Engineeringによって、AIは自律的に仕事を続けられるようになった。  
> しかし、現実の約束はCodexの複数スレッド、取り込んだ会話、人、接続アプリにまたがっている。  
> テストが通り、ファイルが変更され、レポートが作られても、元の約束が満たされたとは限らない。  
> Open Loop Inboxは、散らばったCommitmentを回収、照合し、残っている判断を人間へ戻し、実行Receiptによって閉じる。**

# 27. 最終タグライン

> **Loop Engineering taught agents how to keep working.  
> Open Loop Inbox makes sure the work actually gets closed.**

