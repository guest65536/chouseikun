import Link from "next/link";
import EventForm from "./EventForm";

export default function NewEventPage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-10">
      <Link href="/" className="text-sm text-gray-500 hover:underline">
        ← トップに戻る
      </Link>
      <h1 className="mt-4 mb-6 text-2xl font-bold">イベントを作成</h1>
      <EventForm />
    </main>
  );
}
