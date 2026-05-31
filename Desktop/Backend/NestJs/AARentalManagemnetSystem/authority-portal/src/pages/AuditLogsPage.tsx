import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ClipboardList, RefreshCw, Search } from "lucide-react";
import { Pagination } from "@/components/Pagination";
import { useToast } from "@/components/Toast";
import { apiListAuditLogs, getAccessToken } from "@/lib/api";
import type { AuditLog } from "@/lib/types";

const PAGE_SIZE = 25;

const ENTITY_COLORS: Record<string, string> = {
  property: "bg-amber-100 text-amber-800",
  agreement: "bg-primary-100 text-primary-800",
  dispute: "bg-rose-100 text-rose-800",
  rent_adjustment: "bg-emerald-100 text-emerald-800",
  user: "bg-stone-100 text-stone-700",
};

function entityColor(entity: string) {
  return ENTITY_COLORS[entity.toLowerCase()] ?? "bg-stone-100 text-stone-700";
}

function actionLabel(action: string) {
  return action
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function LogRow({ log }: { log: AuditLog }) {
  return (
    <tr className="hover:bg-stone-50 transition-colors">
      <td className="px-4 py-3 text-xs text-stone-500 whitespace-nowrap">
        {new Date(log.timestamp).toLocaleString()}
      </td>
      <td className="px-4 py-3">
        <div className="text-sm font-medium text-stone-900">
          {log.user.firstName} {log.user.lastName}
        </div>
        <div className="text-xs text-stone-400">{log.user.email}</div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-mono text-stone-700">
          {actionLabel(log.action)}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${entityColor(log.entity)}`}
        >
          {log.entity}
        </span>
        <span className="ml-2 text-xs text-stone-400 font-mono">
          {log.entityId.slice(0, 8)}…
        </span>
      </td>
      <td className="px-4 py-3 max-w-xs">
        <p className="text-xs text-stone-500 truncate" title={log.details}>
          {log.details}
        </p>
      </td>
      <td className="px-4 py-3 text-xs text-stone-400 font-mono">
        {log.ipAddress}
      </td>
    </tr>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {[28, 40, 32, 36, 60, 24].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-4 bg-stone-200 rounded animate-pulse"
            style={{ width: `${w * 3}px`, maxWidth: "100%" }}
          />
        </td>
      ))}
    </tr>
  );
}

export function AuditLogsPage() {
  const { error: toastError } = useToast();
  const [params, setParams] = useSearchParams();

  const page = Number(params.get("page") ?? 1);
  const entityFilter = params.get("entity") ?? "";
  const search = params.get("search") ?? "";

  const [inputSearch, setInputSearch] = useState(search);
  const [data, setData] = useState<{
    items: AuditLog[];
    meta: { page: number; totalPages: number; total: number; pageSize: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const setParam = useCallback(
    (key: string, value: string) => {
      setParams((prev) => {
        const n = new URLSearchParams(prev);
        if (value) n.set(key, value);
        else n.delete(key);
        if (key !== "page") n.delete("page");
        return n;
      });
    },
    [setParams],
  );

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (entityFilter) p.set("entity", entityFilter);
    if (search) p.set("action", search);
    p.set("page", String(page));
    p.set("pageSize", String(PAGE_SIZE));
    return p.toString();
  }, [entityFilter, search, page]);

  const load = useCallback(() => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    apiListAuditLogs(token, query)
      .then(setData)
      .catch((e) =>
        toastError(e instanceof Error ? e.message : "Failed to load audit logs"),
      )
      .finally(() => setLoading(false));
  }, [query, toastError]);

  useEffect(load, [load]);

  const ENTITIES = ["property", "agreement", "dispute", "rent_adjustment", "user"];

  const handleSearch = () => setParam("search", inputSearch.trim());

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 mb-1">Audit Logs</h1>
          <p className="text-stone-500 text-sm">
            Immutable record of all authority actions performed on the platform.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-stone-200 hover:bg-stone-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-3 py-2 flex-1 min-w-48 max-w-sm">
          <Search className="w-4 h-4 text-stone-400" />
          <input
            className="flex-1 text-sm outline-none bg-transparent"
            placeholder="Search by action…"
            value={inputSearch}
            onChange={(e) => setInputSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          {inputSearch && (
            <button
              type="button"
              className="text-stone-400 hover:text-stone-600"
              onClick={() => {
                setInputSearch("");
                setParam("search", "");
              }}
            >
              ×
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleSearch}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          Search
        </button>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setParam("entity", "")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${!entityFilter ? "bg-primary-600 text-white border-primary-600" : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"}`}
          >
            All entities
          </button>
          {ENTITIES.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setParam("entity", e)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${entityFilter === e ? "bg-primary-600 text-white border-primary-600" : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"}`}
            >
              {e.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Stats banner */}
      {data && (
        <div className="mb-4 text-xs text-stone-500">
          Showing {data.items.length} of {data.meta.total} audit entries
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                {["Timestamp", "User", "Action", "Entity", "Details", "IP"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))
                : data?.items.map((log) => <LogRow key={log.id} log={log} />)}
              {!loading && data?.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-stone-400">
                    <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No audit logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            pageSize={data.meta.pageSize}
            onPage={(p) => setParam("page", String(p))}
          />
        </div>
      )}
    </div>
  );
}
