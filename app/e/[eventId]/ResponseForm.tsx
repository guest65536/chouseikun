"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { submitResponse, type SubmitResponseState } from "./actions";

type Candidate = { id: string; label: string };

const CHOICES: { value: "OK" | "MAYBE" | "NG"; symbol: string; label: string }[] =
  [
    { value: "OK", symbol: "◯", label: "参加" },
    { value: "MAYBE", symbol: "△", label: "未定" },
    { value: "NG", symbol: "✕", label: "不参加" },
  ];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
    >
      {pending ? "送信中..." : "回答を送信する"}
    </button>
  );
}

export default function ResponseForm({
  eventId,
  candidates,
}: {
  eventId: string;
  candidates: Candidate[];
}) {
  const [state, formAction] = useActionState<SubmitResponseState, FormData>(
    submitResponse,
    {}
  );
  const formRef = useRef<HTMLFormElement>(null);

  // 送信成功したらフォームを初期化する
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      <input type="hidden" name="eventId" value={eventId} />

      {state.error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          回答を送信しました！集計に反映されています。
        </p>
      )}

      <div className="space-y-1">
        <label htmlFor="name" className="block text-sm font-medium">
          お名前 <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={50}
          placeholder="例: 山田"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="space-y-3">
        <span className="block text-sm font-medium">出欠</span>
        {candidates.map((c) => (
          <div
            key={c.id}
            className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="text-sm">{c.label}</span>
            <div className="flex gap-2">
              {CHOICES.map((choice, idx) => (
                <label
                  key={choice.value}
                  className="flex cursor-pointer items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
                >
                  <input
                    type="radio"
                    name={`status__${c.id}`}
                    value={choice.value}
                    defaultChecked={idx === 0}
                    className="accent-blue-600"
                  />
                  <span>
                    {choice.symbol} {choice.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <label htmlFor="comment" className="block text-sm font-medium">
          コメント（任意）
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={2}
          maxLength={1000}
          placeholder="例: 遅れて参加します"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
