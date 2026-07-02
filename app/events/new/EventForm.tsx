"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createEvent, type CreateEventState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
    >
      {pending ? "作成中..." : "イベントを作成する"}
    </button>
  );
}

export default function EventForm() {
  const [state, formAction] = useActionState<CreateEventState, FormData>(
    createEvent,
    {}
  );
  // 候補日の入力欄。最初は3つ表示し、ボタンで増減できる。
  const [candidateCount, setCandidateCount] = useState(3);

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="space-y-1">
        <label htmlFor="title" className="block text-sm font-medium">
          イベント名 <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={100}
          placeholder="例: 忘年会の日程"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="description" className="block text-sm font-medium">
          説明（任意）
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={2000}
          placeholder="例: 場所は未定です。参加できる日を教えてください。"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="adminEmail" className="block text-sm font-medium">
          通知メール（任意）
        </label>
        <input
          id="adminEmail"
          name="adminEmail"
          type="email"
          placeholder="例: you@example.com"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
        />
        <p className="text-xs text-gray-400">
          入力すると、誰かが回答したときにこのアドレスへお知らせが届きます。
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">
          候補日 <span className="text-red-500">*</span>
        </label>
        {Array.from({ length: candidateCount }).map((_, i) => (
          <input
            key={i}
            name="candidates"
            type="text"
            placeholder={`例: 12/${10 + i}(金) 19:00〜`}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        ))}
        <div className="flex gap-3 text-sm">
          <button
            type="button"
            onClick={() => setCandidateCount((c) => c + 1)}
            className="text-blue-600 hover:underline"
          >
            ＋ 候補日を追加
          </button>
          {candidateCount > 1 && (
            <button
              type="button"
              onClick={() => setCandidateCount((c) => c - 1)}
              className="text-gray-500 hover:underline"
            >
              － 減らす
            </button>
          )}
        </div>
      </div>

      <SubmitButton />
    </form>
  );
}
