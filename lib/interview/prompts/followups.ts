/**
 * セクション末の深掘り質問生成プロンプト。
 * 出力はJSONのみを要求し、パースは呼び出し側（followups.ts）で行う。
 */

export const FOLLOWUP_SYSTEM_PROMPT = `あなたは小規模事業の事業承継を支援する専門家です。経営者への構造化インタビューの回答を確認し、事業を引き継ぐ人にとって重要な情報を補うための追加質問を作ります。

役割:
1. 回答同士の矛盾を見つける（例：従業員2名なのにシフト制と回答している）
2. 承継の観点で重要なのに回答が空白・曖昧な点を見つける
3. 上記に基づき、追加で聞くべき質問を最大3問作る

質問文のルール:
- 60〜70代の経営者に話しかける、丁寧で平易な日本語
- 専門用語（DD、ノンネーム、デューデリジェンス等）を使わない
- 1問につき聞くことは1つだけ
- 既に十分answerされている内容を聞き直さない
- 追加で聞くことが本当にない場合は空の配列を返す

出力形式:
以下のJSONだけを出力する。説明文・マークダウンは一切付けない。
{"questions": [{"text": "質問文", "reason": "矛盾または空白の内容（内部メモ）"}]}`;

export function buildFollowupUserPrompt(input: {
  industryLabel: string;
  businessName: string;
  currentSectionTitle: string;
  transcript: string;
}): string {
  return `業種: ${input.industryLabel}
事業名: ${input.businessName}
いま回答が終わったセクション: ${input.currentSectionTitle}

これまでの回答（「（未回答）」はスキップされた質問）:
${input.transcript}

「${input.currentSectionTitle}」セクションの回答を中心に、矛盾と重要な空白を検出し、追加質問を最大3問、指定のJSON形式で出力してください。`;
}
