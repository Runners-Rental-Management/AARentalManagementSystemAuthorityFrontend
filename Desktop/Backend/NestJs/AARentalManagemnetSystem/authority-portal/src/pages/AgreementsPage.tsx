import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronRight, FileCheck, Search } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Pagination } from "@/components/Pagination";
import { apiListAgreements, getAccessToken } from "@/lib/api";
import type { AgreementStatus, TenancyAgreement } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/utils";

const STATUSES: [string, string][] = [
  ["pending_verification", "Pending verification"],
  ["pending_payment", "Pending payment"],
  ["extension_requested", "Extension requested"],
  ["termination_requested", "Termination requested"],
  ["active", "Active"],
  ["extended", "Extended"],
  ["terminated", "Terminated"],
  ["expired", "Expired"],
  ["rejected", "Rejected"],
  ["all", "All"],
];

const PAGE_SIZE = 20;

function SkeletonRow() {
  return (
    <tr className="border-t border-stone-50">
      {[3, 2, 1.5, 1.5, 1.2, 1, 0.5].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div
            className="h-4 bg-stone-100 rounded-full animate-pulse"
            style={{ width: `${w * 5}rem`, maxWidth: "100%" }}
          />
        </td>
      ))}
    </tr>
  );
}

export function AgreementsPage() {
  const [params, setParams] = useSearchParams();
  const rawStatus = params.get("status");
  const status =
    rawStatus === "pending_dara_verification"
      ? "pending_verification"
      : rawStatus ?? "pending_verification";
  const currentPage = Number(params.get("page") ?? "1");
  const search = params.get("search") ?? "";

  const [items, setItems] = useState<TenancyAgreement[]>([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, page: 1, pageSize: PAGE_SIZE });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.get("status") === "pending_dara_verification") {
      const next = new URLSearchParams(params);
      next.set("status", "pending_verification");
      setParams(next, { replace: true });
    }
  }, [params, setParams]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    const qParts = [`page=${currentPage}`, `pageSize=${PAGE_SIZE}`];
    if (status !== "all") qParts.push(`status=${status}`);
    if (search) qParts.push(`search=${encodeURIComponent(search)}`);
    void apiListAgreements(token, qParts.join("&"))
      .then((r) => {
        setItems(r.items);
        setMeta(r.meta);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [status, currentPage, search]);

  function setStatus(s: string) {
    const next = new URLSearchParams(params);
    next.delete("page");
    if (s === "all") next.set("status", "all");
    else next.set("status", s);
    setParams(next);
  }

  function handleSearch(val: string) {
    const next = new URLSearchParams(params);
    if (val) next.set("search", val);
    else next.delete("search");
    next.delete("page");
    setParams(next);
  }

  const isAllStatus = status === "all";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Tenancy Agreements</h1>
          <p className="text-sm text-stone-500 mt-0.5">Review and verify tenancy agreement submissions</p>
        </div>
        {!loading && (
          <span className="text-sm text-stone-500 bg-white border border-stone-200 px-3 py-1.5 rounded-lg">
            {meta.total} total
          </span>
        )}
      </div>

      {/* Filters bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="search"
            placeholder="Search property, landlord or tenant…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch((e.target as HTMLInputElement).value);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-stone-50"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map(([value, label]) => {
            const active = value === "all" ? isAllStatus : status === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setStatus(value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  active
                    ? "bg-primary-600 text-white border-primary-600 shadow-sm shadow-primary-200"
                    : "bg-white text-stone-600 border-stone-200 hover:border-primary-300 hover:text-primary-600"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-stone-50 to-stone-100 border-b border-stone-200">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Property</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Parties</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Rent</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Term</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Submitted</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {loading
                ? Array.from({ length: 7 }).map((_, i) => <SkeletonRow key={i} />)
                : items.map((a) => (
                    <tr key={a.id} className="hover:bg-primary-50/30 transition-colors group">
                      <td className="px-5 py-4">
                        <p className="font-medium text-stone-900 line-clamp-1">{a.propertyTitle}</p>
                        <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">{a.propertyAddress}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-0.5">
                          <p className="text-xs text-stone-700">
                            <span className="text-stone-400 font-medium mr-1">L</span>{a.landlordName}
                          </p>
                          <p className="text-xs text-stone-500">
                            <span className="text-stone-400 font-medium mr-1">T</span>{a.tenantName}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-stone-900">{formatMoney(a.monthlyRent)}</span>
                        <span className="text-xs text-stone-400">/mo</span>
                      </td>
                      <td className="px-5 py-4 text-xs text-stone-500 whitespace-nowrap">
                        <p>{formatDate(a.startDate).split(",")[0]}</p>
                        <p className="text-stone-400">→ {formatDate(a.endDate).split(",")[0]}</p>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge value={a.status as AgreementStatus} />
                      </td>
                      <td className="px-5 py-4 text-xs text-stone-400 whitespace-nowrap">
                        {formatDate(a.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          to={`/agreements/${a.id}`}
                          className="flex items-center gap-1 text-xs font-semibold text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                        >
                          Review <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {!loading && items.length === 0 && (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3">
              <FileCheck className="w-6 h-6 text-stone-400" />
            </div>
            <p className="text-sm font-medium text-stone-600">No agreements found</p>
            <p className="text-xs text-stone-400 mt-1">Try a different status filter or search term.</p>
          </div>
        )}

        {meta.totalPages > 1 && (
          <div className="border-t border-stone-100 px-5 py-3">
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
