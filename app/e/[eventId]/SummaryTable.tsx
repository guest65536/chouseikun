type Status = "OK" | "MAYBE" | "NG";

type Candidate = { id: string; label: string };
type Participant = {
  id: string;
  name: string;
  comment: string | null;
  responses: { eventDateId: string; status: Status }[];
};

const SYMBOL: Record<Status, { mark: string; className: string }> = {
  OK: { mark: "◯", className: "text-green-600" },
  MAYBE: { mark: "△", className: "text-amber-500" },
  NG: { mark: "✕", className: "text-red-500" },
};

export default function SummaryTable({
  candidates,
  participants,
}: {
  candidates: Candidate[];
  participants: Participant[];
}) {
  if (participants.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-400">
        まだ回答がありません。最初の回答者になりましょう！
      </p>
    );
  }

  // participantId -> eventDateId -> status を引ける形に変換
  const lookup = new Map<string, Map<string, Status>>();
  for (const p of participants) {
    const inner = new Map<string, Status>();
    for (const r of p.responses) inner.set(r.eventDateId, r.status);
    lookup.set(p.id, inner);
  }

  // 候補日ごとの◯の数（最有力候補の判定に使う）
  const okCounts = candidates.map(
    (c) =>
      participants.filter((p) => lookup.get(p.id)?.get(c.id) === "OK").length
  );
  const maxOk = Math.max(0, ...okCounts);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="p-2 text-left font-medium">候補日</th>
            {participants.map((p) => (
              <th key={p.id} className="p-2 text-center font-medium">
                {p.name}
              </th>
            ))}
            <th className="p-2 text-center font-medium text-green-600">◯</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c, i) => {
            const isBest = okCounts[i] === maxOk && maxOk > 0;
            return (
              <tr
                key={c.id}
                className={`border-b border-gray-100 ${
                  isBest ? "bg-green-50" : ""
                }`}
              >
                <td className="p-2">
                  {c.label}
                  {isBest && (
                    <span className="ml-2 rounded bg-green-600 px-1.5 py-0.5 text-xs text-white">
                      最有力
                    </span>
                  )}
                </td>
                {participants.map((p) => {
                  const status = lookup.get(p.id)?.get(c.id);
                  const s = status ? SYMBOL[status] : null;
                  return (
                    <td
                      key={p.id}
                      className={`p-2 text-center text-lg ${s?.className ?? "text-gray-300"}`}
                    >
                      {s?.mark ?? "-"}
                    </td>
                  );
                })}
                <td className="p-2 text-center font-semibold text-green-600">
                  {okCounts[i]}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {participants.some((p) => p.comment) && (
        <div className="mt-4 space-y-1 text-sm">
          <h3 className="font-medium text-gray-500">コメント</h3>
          {participants
            .filter((p) => p.comment)
            .map((p) => (
              <p key={p.id} className="text-gray-600">
                <span className="font-medium">{p.name}:</span> {p.comment}
              </p>
            ))}
        </div>
      )}
    </div>
  );
}
