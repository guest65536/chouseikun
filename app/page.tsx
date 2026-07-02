import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">調整くん</h1>
        <p className="text-lg text-gray-500">
          ログイン不要。イベントを作って、URLを共有するだけ。
          <br />
          みんなの出欠をかんたんに集められます。
        </p>
      </div>

      <Link
        href="/events/new"
        className="rounded-full bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-sm transition hover:bg-blue-700"
      >
        イベントを作成する
      </Link>

      <ol className="mt-6 space-y-2 text-left text-sm text-gray-500">
        <li>1. イベント名と候補日を入力して作成</li>
        <li>2. 発行されたURLをLINEやXで共有</li>
        <li>3. みんなが ◯ △ ✕ で回答 → 集計が自動表示</li>
      </ol>
    </main>
  );
}
