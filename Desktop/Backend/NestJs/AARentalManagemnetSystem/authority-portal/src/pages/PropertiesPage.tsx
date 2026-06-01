import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Pagination } from "@/components/Pagination";
import { apiListProperties, getAccessToken } from "@/lib/api";
import type { Property } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/utils";

const PAGE_SIZE = 20;

const STATUSES: [string, string][] = [
  ["pending_verification", "Pending review"],
  ["available", "Available"],
  ["rented", "Rented"],
  ["rejected", "Rejected"],
  ["all", "All"],
];

export function PropertiesPage() {
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "pending_verification";
  const currentPage = Number(params.get("page") ?? "1");
  const search = params.get("search") ?? "";

  const [items, setItems] = useState<Property[]>([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, page: 1, pageSize: PAGE_SIZE });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    const qParts = [`page=${currentPage}`, `pageSize=${PAGE_SIZE}`];
    if (status !== "all") qParts.push(`status=${status}`);
    if (search) qParts.push(`search=${encodeURIComponent(search)}`);
    void apiListProperties(token, qParts.join("&"))
      .then((r) => {
        setItems(r.items);
        setMeta(r.meta);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"))
      .finally(() => setLoading(false));
  }, [status, currentPage, search]);

  function setStatus(s: string) {
    const next = new URLSearchParams();
    if (s !== "all") next.set("status", s);
    setParams(next);
  }

  function setPage(p: number) {
    const next = new URLSearchParams(params);
    next.set("page", String(p));
    setParams(next);
  }

  function handleSearch(val: string) {
    const next = new URLSearchParams(params);
    if (val) next.set("search", val);
    else next.delete("search");
    next.delete("page");
    setParams(next);
  }

  const isAllStatus = status === "all" && !params.get("status");

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-1">Property listings</h1>
      <p className="text-sm text-stone-500 mb-4">
        Review and approve/reject registered property listings.
      </p>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          type="search"
          placeholder="Search by title, address or sub-city…"
          defaultValue={search}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch((e.target as HTMLInputElement).value);
          }}
          onBlur={(e) => handleSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUSES.map(([value, label]) => {
          const active = value === "all" ? isAllStatus : status === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                active
                  ? "bg-primary-600 text-white border-primary-600"
                  : "bg-white text-stone-600 border-stone-200 hover:border-primary-300"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-stone-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Rent</th>
                <th className="px-4 py-3 font-medium">Landlord</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Listed</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-t border-stone-100">
                    <td className="px-4 py-3" colSpan={8}>
                      <div className="h-4 bg-stone-100 rounded animate-pulse w-full" />
                    </td>
                  </tr>
                ))
              ) : (
                items.map((p) => (
                  <tr
                    key={p.id}
                    className="border-t border-stone-100 hover:bg-stone-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-stone-900">
                      {p.title}
                    </td>
                    <td className="px-4 py-3 text-stone-600 text-xs">
                      {p.subCity}
                      <br />
                      <span className="text-stone-400">Woreda {p.woreda}</span>
                    </td>
                    <td className="px-4 py-3 text-stone-600 capitalize">
                      {p.propertyType}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {formatMoney(p.monthlyRent)}
                    </td>
                    <td className="px-4 py-3 text-stone-600">{p.landlordName}</td>
                    <td className="px-4 py-3">
                      <StatusBadge value={p.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500">
                      {formatDate(p.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/properties/${p.id}`}
                        className="text-primary-600 font-medium hover:underline text-sm"
                      >
                        {p.status === "pending_verification" ? "Review →" : "View →"}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && items.length === 0 && (
          <p className="p-10 text-center text-stone-500">No properties found.</p>
        )}

        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          total={meta.total}
          pageSize={meta.pageSize}
          onPage={setPage}
        />
      </div>
    </div>
  );
}
