
import { Type } from "@google/genai";

export const PROMPT_EXTRACT = `
役割：あなたは学校・園の「クラスだより」の本文テキストから、【概要サマリ】【重要ポイント】【行動が必要な項目（イベント/TODO）】【通知不要の情報】に分解し、厳格なJSONを出力するAIです。

要件：
- 入力はOCR済みの素テキストです。見出し（例：提灯づくり/夏の遊び）や箇条書きを手がかりにセクションを正しく認識してください。
- 「7月号」「令和◯年◯月◯日発行」などから issue_month（YYYY-MM形式）と issue_date（YYYY-MM-DD形式）を推定してください。
- “行動が必要”の定義は、提出・準備・持ち物・参加可否の確認・支払い・当日判断が必要な事柄・反復して持参するもの（体操服/水遊びセットなど）です。
- 本文中に「継続」「引き続き」「再掲」などの言葉で、以前からのお願いであることが示されている項目は is_continuation を true に設定してください。新規の依頼事項の場合は false または省略してください。
- 本文に上記「行動が必要」な項目が一切含まれない場合、 \`actions\` 配列は空（\`[]\`）にしてください。その場合でも、\`overview\`と\`key_points\`は本文全体を要約して生成してください。
- “通知不要”の定義は、学級の近況報告、作品の紹介、誕生日リスト（自分の子以外）、季節の話題など、直接的なアクションを伴わない情報です。
- 繰り返しルールは repeat_rule を {"byDay":["MO","TU"], "time":"HH:mm"} 形式で表現してください。明記がない場合は null としてください。
- 「ぶくぶくうがいの練習」のような、特定の曜日が指定されていない習慣的な依頼事項（毎日行うべきこと）は、平日の繰り返しルール（例: {"byDay":["MO","TU","WE","TH","FR"], "time": "08:00"}）として\`repeat_rule\`を設定してください。
- 重要度(importance)は high/medium/low の3段階で評価してください。締切が近い、当日の朝に準備が必要、緊急の言葉がある場合は high です。
- 推測は禁止します。原文にない持ち物や日付は生成せず、曖昧な場合は notes に「要確認」と記述してください。
- 出力は指定されたスキーマのJSONオブジェクトのみとし、前後に\`\`\`jsonや他のテキストを含めないでください。
`;

export const CLASS_NEWSLETTER_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    header: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'クラスだよりのタイトル（例: 7月号クラスだより）', nullable: true },
        class_name: { type: Type.STRING, description: 'クラス名（例: うさぎ組）', nullable: true },
        school_name: { type: Type.STRING, description: '学校名・園名', nullable: true },
        issue_month: { type: Type.STRING, description: '発行月 (YYYY-MM)', nullable: true },
        issue_date: { type: Type.STRING, description: '発行日 (YYYY-MM-DD)', nullable: true },
      },
      required: ['title', 'class_name', 'school_name', 'issue_month', 'issue_date'],
    },
    overview: { type: Type.STRING, description: 'おたより全体の150字以内の日本語要約。結論を先に書く。' },
    key_points: {
      type: Type.ARRAY,
      description: '保護者が把握すべき3〜6個の箇条書き要点。行動に関する語（準備/提出/持参/確認）を優先する。',
      items: { type: Type.STRING },
    },
    actions: {
      type: Type.ARRAY,
      description: '保護者による具体的な行動が必要な項目（イベントやTODO）のリスト。',
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ['event', 'todo'], description: '項目の種類' },
          event_name: { type: Type.STRING, description: 'イベントやTODOの名称' },
          is_continuation: {
            type: Type.BOOLEAN,
            description: '以前から継続している依頼事項かどうか。本文に「継続」「引き続き」「再掲」などの文言がある場合にtrueにする。',
            nullable: true,
          },
          event_date: { type: Type.STRING, description: 'イベント開催日 (YYYY-MM-DD)', nullable: true },
          due_date: { type: Type.STRING, description: '提出物や支払いの締切日 (YYYY-MM-DD)', nullable: true },
          items: { type: Type.ARRAY, description: '持ち物や提出物のリスト', items: { type: Type.STRING } },
          fee: { type: Type.STRING, description: '必要な費用', nullable: true },
          repeat_rule: {
            type: Type.OBJECT,
            nullable: true,
            properties: {
              byDay: { type: Type.ARRAY, items: { type: Type.STRING }, description: '曜日 (MO, TU, WE, TH, FR, SA, SU)' },
              time: { type: Type.STRING, description: '時間 (HH:mm)' },
            },
             required: ['byDay', 'time'],
          },
          audience: { type: Type.STRING, description: '対象者（例: 1年1組, 全園児）', nullable: true },
          importance: { type: Type.STRING, enum: ['high', 'medium', 'low'], description: '重要度' },
          action_required: { type: Type.BOOLEAN, description: '常時true' },
          notes: { type: Type.STRING, description: '補足事項（例: 要確認）', nullable: true },
          confidence: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.NUMBER, description: 'event_dateの信頼度 (0-1)' },
              due: { type: Type.NUMBER, description: 'due_dateの信頼度 (0-1)' },
              items: { type: Type.NUMBER, description: 'itemsの信頼度 (0-1)' },
            },
            required: ['date', 'due', 'items'],
          },
        },
        required: ['type', 'event_name', 'event_date', 'due_date', 'items', 'fee', 'repeat_rule', 'audience', 'importance', 'action_required', 'notes', 'confidence'],
      },
    },
    infos: {
      type: Type.ARRAY,
      description: '通知不要だが参考になる情報のリスト。',
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: '情報項目の見出し' },
          summary: { type: Type.STRING, description: '80字以内の要約' },
          audience: { type: Type.STRING, description: '関連する対象者', nullable: true },
        },
        required: ['title', 'summary', 'audience'],
      },
    },
  },
  required: ['header', 'overview', 'key_points', 'actions', 'infos'],
};