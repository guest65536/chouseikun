import { Resend } from "resend";

// APIキーが未設定でもアプリが落ちないようにする（未設定なら送信をスキップ）
const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

// 独自ドメインが無い間は Resend の共有送信元を使う。
// ドメインを認証したら、環境変数 EMAIL_FROM に "調整くん <noreply@あなたのドメイン>" を設定する。
const FROM = process.env.EMAIL_FROM ?? "調整くん <onboarding@resend.dev>";

type ResponseNotification = {
  to: string;
  eventTitle: string;
  participantName: string;
  eventUrl: string;
};

// 新しい回答が届いたことを管理者にメール通知する。
// 失敗してもアプリの動作は止めない（呼び出し側で握りつぶす想定）。
export async function sendResponseNotification({
  to,
  eventTitle,
  participantName,
  eventUrl,
}: ResponseNotification): Promise<void> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY 未設定のため通知メールをスキップしました");
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `【調整くん】「${eventTitle}」に${participantName}さんが回答しました`,
    html: `
      <div style="font-family: sans-serif; line-height: 1.7;">
        <p><strong>${participantName}</strong> さんが「<strong>${eventTitle}</strong>」に回答しました。</p>
        <p><a href="${eventUrl}">回答ページを開いて集計を見る →</a></p>
        <hr />
        <p style="color:#888; font-size:12px;">調整くん（自動送信）</p>
      </div>
    `,
  });

  if (error) {
    // 送信失敗はログに残すだけ（回答自体は成功させる）
    console.error("[email] 通知メールの送信に失敗:", error);
  }
}
