"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { submitResponseSchema } from "@/lib/validation";

export type SubmitResponseState = { error?: string; success?: boolean };

export async function submitResponse(
  _prevState: SubmitResponseState,
  formData: FormData
): Promise<SubmitResponseState> {
  const eventId = String(formData.get("eventId") ?? "");
  if (!eventId) return { error: "イベントが見つかりません" };

  // status__<候補日ID> という名前のフィールドを集めて回答配列を作る
  const responses: { eventDateId: string; status: string }[] = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("status__")) {
      responses.push({
        eventDateId: key.slice("status__".length),
        status: String(value),
      });
    }
  }

  const parsed = submitResponseSchema.safeParse({
    name: formData.get("name") ?? "",
    comment: formData.get("comment") ?? "",
    responses,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };
  }

  const { name, comment, responses: validResponses } = parsed.data;

  // 参加者と回答をまとめて作成（回答を後から編集するための editToken も自動生成される）
  await prisma.participant.create({
    data: {
      eventId,
      name,
      comment: comment || null,
      responses: {
        create: validResponses.map((r) => ({
          eventDateId: r.eventDateId,
          status: r.status as "OK" | "MAYBE" | "NG",
        })),
      },
    },
  });

  // 集計表を最新にする
  revalidatePath(`/e/${eventId}`);
  return { success: true };
}
