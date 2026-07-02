import { z } from "zod";

// イベント作成フォームの入力チェック
export const createEventSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "イベント名を入力してください")
    .max(100, "イベント名は100文字以内で入力してください"),
  description: z
    .string()
    .trim()
    .max(2000, "説明は2000文字以内で入力してください")
    .optional(),
  adminEmail: z
    .string()
    .trim()
    .email("メールアドレスの形式が正しくありません")
    .optional(),
  candidates: z
    .array(z.string().trim().min(1))
    .min(1, "候補日を1つ以上入力してください")
    .max(50, "候補日は50件までです"),
});

// 出欠回答フォームの入力チェック
export const submitResponseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "お名前を入力してください")
    .max(50, "お名前は50文字以内で入力してください"),
  comment: z
    .string()
    .trim()
    .max(1000, "コメントは1000文字以内で入力してください")
    .optional(),
  responses: z
    .array(
      z.object({
        eventDateId: z.string().min(1),
        status: z.enum(["OK", "MAYBE", "NG"]),
      })
    )
    .min(1, "候補日への回答がありません"),
});
