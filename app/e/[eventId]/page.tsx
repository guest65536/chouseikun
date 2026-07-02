import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ResponseForm from "./ResponseForm";
import SummaryTable from "./SummaryTable";

export default async function AnswerPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      candidates: { orderBy: { sortOrder: "asc" } },
      participants: {
        orderBy: { createdAt: "asc" },
        include: { responses: true },
      },
    },
  });

  if (!event) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-10 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">{event.title}</h1>
        {event.description && (
          <p className="whitespace-pre-wrap text-gray-600">{event.description}</p>
        )}
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-bold">みんなの回答</h2>
        <SummaryTable
          candidates={event.candidates}
          participants={event.participants}
        />
      </section>

      <section className="space-y-4 rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-bold">あなたの出欠を回答する</h2>
        <ResponseForm eventId={event.id} candidates={event.candidates} />
      </section>
    </main>
  );
}
