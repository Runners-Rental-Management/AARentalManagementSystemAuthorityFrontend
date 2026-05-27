import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertCircle, TrendingUp } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Pagination } from "@/components/Pagination";
import {
  apiListRentAdjustments,
  apiReviewRentAdjustment,
  getAccessToken,
} from "@/lib/api";
import { getErrorMessage } from "@/lib/api-error";
import { useToast } from "@/components/Toast";
import type { RentAdjustment } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/utils";

const PAGE_SIZE = 15;

export function RentAdjustmentsPage() {
  const [params, setParams] = useSearchParams();
  const filter = params.get("status") ?? "pending";
  const currentPage = Number(params.get("page") ?? "1");

  const [items, setItems] = useState<RentAdjustment[]>([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, page: 1, pageSize: PAGE_SIZE });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const toast = useToast();

  const load = () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    const qParts = [`page=${currentPage}`, `pageSize=${PAGE_SIZE}`];
    if (filter !== "all") qParts.push(`status=${filter}`);
    void apiListRentAdjustments(token, qParts.join("&"))
      .then((r) => {
        setItems(r.items);
        setMeta(r.meta);
        setError(null);
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filter, currentPage]);

  function setFilter(s: string) {
    const next = new URLSearchParams();
    if (s !== "all") next.set("status", s);
    setParams(next);
  }

  function setPage(p: number) {
    const next = new URLSearchParams(params);
    next.set("page", String(p));
    setParams(next);
  }

  const review = async (
    id: string,
    status: "approved" | "rejected" | "under_review",
  ) => {
    const token = getAccessToken();
    if (!token) return;
    setBusyId(id);
    setError(null);
    try {
      await apiReviewRentAdjustment(token, id, {
        status,
        reviewNotes: notes[id]?.trim() || undefined,
      });
      toast.success(
        status === "approved"
          ? "Rent adjustment approved. Monthly rent updated."
          : status === "rejected"
          ? "Rent adjustment rejected."
          : "Marked as under review.",
      );
      load();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Rent adjustments</h1>

      <div className="flex gap-2 mb-6">
        {["pending", "under_review", "approved", "rejected", "all"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border capitalize transition-colors ${
              filter === s
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300"
            }`}
          >
            {s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse h-36"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-slate-500 text-center py-16">No rent adjustments found.</p>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((a) => {
              const overLimit = a.increasePercentage > a.maxAllowedPercentage;
              return (
                <div
                  key={a.id}
                  className="bg-white rounded-xl border border-slate-200 p-5"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="font-semibold text-slate-900">{a.propertyTitle}</p>
                      <p className="text-sm text-slate-500">{a.landlordName}</p>
                    </div>
                    <StatusBadge value={a.status} />
                  </div>

                  <div className="flex flex-wrap gap-4 mb-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <TrendingUp className="w-4 h-4" />
                      <span>
                        {formatMoney(a.currentRent)} →{" "}
                        <strong>{formatMoney(a.proposedRent)}</strong>
                      </span>
                      <span
                        className={`font-semibold ${
                          overLimit ? "text-rose-600" : "text-emerald-600"
                        }`}
                      >
                        +{a.increasePercentage.toFixed(1)}%
                      </span>
                    </div>
                    {overLimit && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                        <AlertCircle className="w-3 h-3" />
                        Exceeds {a.maxAllowedPercentage}% cap
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-600 mb-2 leading-relaxed">
                    {a.reason}
                  </p>
                  <p className="text-xs text-slate-400 mb-4">
                    Submitted {formatDate(a.createdAt)}
                    {a.reviewedAt && ` · Reviewed ${formatDate(a.reviewedAt)}`}
                  </p>

                  {a.reviewNotes && (
                    <div className="mb-4 px-3 py-2 rounded-lg bg-sky-50 border border-sky-100 text-sm text-sky-800">
                      <span className="font-medium">Review notes:</span>{" "}
                      {a.reviewNotes}
                    </div>
                  )}

                  {a.status === "pending" && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        placeholder="Review notes (optional)"
                        value={notes[a.id] ?? ""}
                        onChange={(e) =>
                          setNotes((n) => ({ ...n, [a.id]: e.target.value }))
                        }
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      />
                      <button
                        type="button"
                        disabled={busyId === a.id}
                        onClick={() => review(a.id, "under_review")}
                        className="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium disabled:opacity-50 whitespace-nowrap transition-colors"
                      >
                        Mark under review
                      </button>
                      <button
                        type="button"
                        disabled={busyId === a.id}
                        onClick={() => review(a.id, "approved")}
                        className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-50 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busyId === a.id}
                        onClick={() => review(a.id, "rejected")}
                        className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium disabled:opacity-50 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {a.status === "under_review" && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        placeholder="Final review notes (optional)"
                        value={notes[a.id] ?? ""}
                        onChange={(e) =>
                          setNotes((n) => ({ ...n, [a.id]: e.target.value }))
                        }
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      />
                      <button
                        type="button"
                        disabled={busyId === a.id}
                        onClick={() => review(a.id, "approved")}
                        className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-50 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busyId === a.id}
                        onClick={() => review(a.id, "rejected")}
                        className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium disabled:opacity-50 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 bg-white rounded-xl border border-slate-200">
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              pageSize={meta.pageSize}
              onPage={setPage}
            />
          </div>
        </>
      )}
    </div>
  );
}
