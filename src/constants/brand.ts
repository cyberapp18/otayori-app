// ブランド定義に基づく定数とユーティリティ

export const BRAND = {
  // ブランドエッセンス
  tagline: "おたより、ポン！ですっきり。",
  purpose: "親・保育者の「おたより管理」をAIでシンプルにし、家族の時間を増やす。",
  
  // タイポグラフィクラス
  typography: {
    h1: "font-heading text-3xl md:text-4xl font-bold text-ink",
    h2: "font-heading text-xl md:text-2xl font-semibold text-ink",
    h3: "font-heading text-lg md:text-xl font-medium text-ink",
    h4: "font-heading text-base md:text-lg font-medium text-ink",
    body: "font-sans text-sm md:text-base text-ink",
    caption: "font-sans text-xs md:text-sm text-gray-600",
  },
  
  // UIコンポーネントスタイル
  components: {
    card: "bg-white rounded-xl shadow-md p-6",
    button: {
      primary: "bg-pon-orange hover:bg-orange-600 text-white font-medium px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky focus:ring-opacity-50 inline-flex items-center justify-center",
      secondary: "bg-gray-100 hover:bg-gray-200 text-ink font-medium px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky focus:ring-opacity-50 inline-flex items-center justify-center",
      danger: "bg-plum hover:bg-red-600 text-white font-medium px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky focus:ring-opacity-50 inline-flex items-center justify-center",
    },
  },
  
  // 状態表示
  status: {
    success: "bg-green-50 text-leaf border-green-200",
    warning: "bg-rose-50 text-plum border-rose-200",
    info: "bg-blue-50 text-sky border-blue-200",
  },
} as const;

// UIマイクロコピー（ブランドトーン&ボイス準拠）
export const COPY = {
  // CTA
  cta: {
    analyze: "AIで読み取る",
    save: "保存して家族と共有",
    upgrade: "プランをアップグレード",
    retry: "もう一度試す",
    cancel: "キャンセル",
  },
  
  // 状態メッセージ
  messages: {
    analyzing: "AIが読み取りました。やることを確認しましょう。",
    saving: "保存しています...",
    success: "保存できました！家族とカレンダーで共有されます。",
    error: "画像を読み取れませんでした。もう一度撮影するか、明るい場所でお試しください。",
    limitReached: "今月の解析回数に達しました。プランをアップグレードして続けられます。",
  },
  
  // プラン説明
  plans: {
    free: "無料プラン：あと{count}回 / 24時間で結果は自動削除",
    upgrade: "保存期間を4週間/6か月に延長、家族5/8人で共有",
  },
  
  // アクセシビリティ用
  a11y: {
    uploadButton: "おたよりの写真を撮影またはアップロード",
    todoCard: "TODO項目: {title} 期限: {date}",
    noticeImage: "園だより・学校からのお知らせの画像",
  },
} as const;

// アニメーションヘルパー
export const ANIMATIONS = {
  fadeIn: "animate-in fade-in duration-brand",
  slideUp: "animate-in slide-in-from-bottom-4 duration-brand",
  gentle: "transition-all duration-brand ease-out",
} as const;
