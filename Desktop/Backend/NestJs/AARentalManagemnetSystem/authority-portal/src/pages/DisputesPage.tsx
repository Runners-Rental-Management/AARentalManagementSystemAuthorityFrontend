import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronRight, Gavel, Search } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Pagination } from "@/components/Pagination";
import { apiListDisputes, getAccessToken } from "@/lib/api";
import type { Dispute, DisputeStatus, PriorityLevel } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const STATUSES: [string, string][] = [
  ["open", "Open"],
  ["under_review", "Under review"],
  ["mediation", "Mediation"],
  ["escalated", "Escalated"],
  ["resolved", "Resolved"],
  ["closed", "Closed"],
  ["all", "All"],
];

const PRIORITIES: [string, string][] = [
  ["", "All priorities"],
  ["critical", "Critical"],
  ["high", "High"],
  ["medium", "Medium"],
  ["low", "Low"],
];

const PAGE_SIZE = 20;

function SkeletonRow() {
  return (
    <tr className="border-t border-slate-100">
      {[3, 2, 1.5, 1, 1, 1, 0.5].map((w, i) => (
        <td key={i} className="px-5 py-3.5">
          <div
            className="h-4 bg-slate-100 rounded-full animate-pulse"
            style={{ width: `${w * 5}rem`, maxWidth: "100%" }}
          />
        </td>
      ))}
    </tr>
  );
}

export function DisputesPage() {
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "open";
  const priority = params.get("priority") ?? "";
  const currentPage = Number(params.get("page") ?? "1");

  const [items, setItems] = useState<Dispute[]>([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, page: 1, pageSize: PAGE_SIZE });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    const qParts = [`page=${currentPage}`, `pageSize=${PAGE_SIZE}`];
    if (status !== "all") qParts.push(`status=${status}`);
    if (priority) qParts.push(`priority=${priority}`);
    void apiListDisputes(token, qParts.join("&"))
      .then((r) => {
        setItems(r.items);
        setMeta(r.meta);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [status, priority, currentPage]);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setParams(next);
  }

  const isAllStatus = status === "all" || !params.get("status");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Disputes</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage and resolve tenant–landlord disputes
          </p>
        </div>
        {!loading && (
          <span className="text-sm text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg">
            {meta.total} total
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            placeholder="Filter by title…"
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setParam("search", (e.target as HTMLInputElement).value);
              }
            }}
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map(([value, label]) => {
            const active = value === "all" ? isAllStatus : status === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setParam("status", value === "all" ? "" : value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  active
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200"
                    : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <select
          value={priority}
          onChange={(e) => setParam("priority", e.target.value)}
          className="ml-auto px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer"
        >
          {PRIORITIES.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Title</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Parties</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Violation</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Priority</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Filed</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading
                ? Array.from({ length: 7 }).map((_, i) => <SkeletonRow key={i} />)
                : items.map((d) => (
                    <tr
                      key={d.id}
                      className="hover:bg-indigo-50/30 transition-colors group"
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-900 leading-snug line-clamp-1">
                          {d.title}
                        </p>
                        {d.propertyTitle && (
                          <p className="text-xs text-slate-400 mt-0.5">{d.propertyTitle}</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-700">{d.reporterName}</p>
                        <p className="text-xs text-slate-400">vs {d.respondentName}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full capitalize">
                          {d.violationType.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge value={d.priority as PriorityLevel} />
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge value={d.status as DisputeStatus} />
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-400 whitespace-nowrap">
                        {formatDate(d.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          to={`/disputes/${d.id}`}
                          className="flex items-center gap-1 text-xs font-semibold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                        >
                          View <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {!loading && items.length === 0 && (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Gavel className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">No disputes found</p>
            <p className="text-xs text-slate-400 mt-1">Try changing the status filter or search term.</p>
          </div>
        )}

        {meta.totalPages > 1 && (
          <div className="border-t border-slate-100 px-5 py-3">
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              pageSize={meta.pageSize}
              onPage={(p) => {
                const next = new URLSearchParams(params);
                next.set("page", String(p));
                setParams(next);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
