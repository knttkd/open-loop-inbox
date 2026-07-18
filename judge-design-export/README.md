# Judge site static design export

Judge site の見た目だけを、本開発側へ移植するための静的デザインカタログです。React、Next.js、照合ロジック、サンプルデータ、イベント処理には依存しません。

## ファイル

- `index.html` — 主要な画面・状態を静的HTMLとして収録
- `judge-design.css` — デザイントークン、コンポーネント、レスポンシブ表示

ブラウザで `index.html` を直接開くと、次の状態をまとめて確認できます。

1. Start
2. Onboarding
3. Analyzing
4. Action review
5. Add instruction / Needs input
6. Evidence dialog
7. Complete / Receipts

## 本開発側へ取り込む

1. `judge-design.css` を本開発側へコピーまたはimportします。
2. `index.html` から必要な `oli-*` 要素だけをコンポーネントへ移します。
3. 静的な文言を本開発側のデータへ置き換えます。
4. `button`、ダイアログ、カード操作へ本開発側のイベントを接続します。

すべてのCSSクラスに `oli-` 接頭辞を付けています。カタログ表示専用の `.oli-catalog*`、`.oli-sample*` は本開発へ取り込む必要がありません。

## デザイントークン

`judge-design.css` 冒頭の変数を上書きすると、全コンポーネントをまとめて調整できます。

```css
:root {
  --oli-ink: #1d2130;
  --oli-muted: #6f7684;
  --oli-blue: #4a63d8;
  --oli-orange: #df6b45;
  --oli-green: #3f9e7d;
  --oli-gold: #a8791a;
}
```

元サイトは Hanken Grotesk、Zen Kaku Gothic New、Geist Mono を使用しています。抽出版は外部通信なしで開けるようフォントファイルを同梱せず、同名フォントがない環境ではシステムフォントへフォールバックします。本開発側で同じ見た目を再現する場合は、既存のフォントローダーからこれら3書体を指定してください。

## 抽出していないもの

- React state、ドラッグ・スワイプ判定、キーボード操作
- Candidate の照合とAction生成
- Demo executor、Receipt生成、Undo
- 画面遷移とアニメーション

これらはデザインではなく本開発側の責務として、意図的に含めていません。HTMLにはアクセシビリティ実装の接続点として、見出し構造、`aria-label`、button要素を残しています。
