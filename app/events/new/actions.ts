"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createEventSchema } from "@/lib/validation";

export type CreateEventState = { error?: string };

export async function createEvent(
  _prevState: CreateEventState,
  formData: FormData
): Promise<CreateEventState> {
  // メール欄は空文字なら「未入力」として扱う（optional な email 検証を通すため）
  const emailRaw = String(formData.get("adminEmail") ?? "").trim();

  const parsed = createEventSchema.safeParse({
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? "",
    adminEmail: emailRaw === "" ? undefined : emailRaw,
    // 候補日は同名フィールドを複数送るので getAll で配列として受け取り、空欄は除外
    candidates: formData
      .getAll("candidates")
      .map((v) => String(v).trim())
      .filter((v) => v.length > 0),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };
  }

  const { title, description, adminEmail, candidates } = parsed.data;

  const event = await prisma.event.create({
    data: {
      title,
      description: description || null,
      adminEmail: adminEmail || null,
      candidates: {
        create: candidates.map((label, index) => ({
          label,
          sortOrder: index,
        })),
      },
    },
  });

  // 作成完了ページへ。管理トークンも渡して管理URLを表示する。
  redirect(`/events/${event.id}/created?admin=${event.adminToken}`);
}
