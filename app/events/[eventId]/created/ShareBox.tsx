"use client";

import { useState } from "react";

export default function ShareBox({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const shareText = `【${title}】の出欠を回答してください`;
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    shareText
  )}&url=${encodeURIComponent(url)}`;
  const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
    url
  )}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // クリップボードが使えない環境では何もしない
    }
  }

  async function webShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareText, url });
      } catch {
        // ユーザーがキャンセルした場合など
      }
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          readOnly
          value={url}
          className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
          onFocus={(e) => e.currentTarget.select()}
        />
        <button
          onClick={copy}
          className="shrink-0 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
        >
          {copied ? "コピー済み" : "コピー"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-80"
        >
          Xでシェア
        </a>
        <a
          href={lineUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-[#06C755] px-4 py-2 text-sm font-medium text-white transition hover:opacity-80"
        >
          LINEでシェア
        </a>
        <button
          onClick={webShare}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-50"
        >
          その他で共有
        </button>
      </div>
    </div>
  );
}
