import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ShareBox from "./ShareBox";

export default async function CreatedPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ admin?: string }>;
}) {
  const { eventId } = await params;
  const { admin } = await searchParams;

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) notFound();

  // 共有用の絶対URLを組み立てる
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const baseUrl = `${proto}://${host}`;
  const answerUrl = `${baseUrl}/e/${eventId}`;

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-10">
      <div className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-green-800">
        ✅ 「{event.title}」を作成しました！
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">回答用URL</h2>
        <p className="text-sm text-gray-500">
          このURLを参加者に共有してください。誰でもログイン不要で回答できます。
        </p>
        <ShareBox url={answerUrl} title={event.title} />
        <Link
          href={`/e/${eventId}`}
          className="inline-block text-sm text-blue-600 hover:underline"
        >
          回答ページを開く →
        </Link>
      </section>

      {admin && (
        <section className="mt-8 space-y-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <h2 className="text-sm font-bold text-amber-800">
            🔑 管理用URL（あなただけが保管してください）
          </h2>
          <p className="text-xs text-amber-700">
            イベントの編集・削除に使います。このURLを知っている人だけが管理できます。
            ブックマークするかメモしておいてください。（管理画面は次のステップで作成予定）
          </p>
          <code className="block break-all rounded bg-white px-2 py-1 text-xs">
            {baseUrl}/admin/{eventId}/{admin}
          </code>
        </section>
      )}
    </main>
  );
}
