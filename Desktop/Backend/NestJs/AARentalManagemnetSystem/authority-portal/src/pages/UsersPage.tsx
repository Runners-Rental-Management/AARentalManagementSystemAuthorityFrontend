import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Building2,
  FileText,
  Lock,
  Search,
  Shield,
  ShieldCheck,
  User,
} from "lucide-react";
import { Pagination } from "@/components/Pagination";
import { useToast } from "@/components/Toast";
import { apiListUsers, getAccessToken } from "@/lib/api";
import type { PlatformRole, PlatformUser } from "@/lib/types";

const PAGE_SIZE = 20;

const ROLE_LABELS: Record<PlatformRole, string> = {
  tenant: "Tenant",
  landlord: "Landlord",
  admin: "Admin",
};

const ROLE_COLORS: Record<PlatformRole, string> = {
  tenant: "bg-sky-100 text-sky-800",
  landlord: "bg-amber-100 text-amber-800",
  admin: "bg-violet-100 text-violet-800",
};

const ALL_ROLES: PlatformRole[] = [
  "tenant",
  "landlord",
  "admin",
];

function RoleBadge({ role }: { role: PlatformRole }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[role]}`}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}

function UserRow({ user }: { user: PlatformUser }) {
  const isLocked =
    user.lockedUntil && new Date(user.lockedUntil) > new Date();

  return (
    <tr className="hover:bg-stone-50 transition-colors">
      <td className="px-4 py-3">
        <Link
          to={`/users/${user.id}`}
          className="flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
            {user.firstName[0]?.toUpperCase()}
            {user.lastName[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-stone-900 group-hover:text-primary-600 transition-colors">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-stone-500">{user.email}</p>
          </div>
        </Link>
      </td>
      <td className="px-4 py-3">
        <RoleBadge role={user.role} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          {user.isVerified ? (
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          ) : (
            <Shield className="w-4 h-4 text-stone-300" />
          )}
          <span
            className={`text-xs font-medium ${user.isVerified ? "text-emerald-700" : "text-stone-400"}`}
          >
            {user.isVerified ? "Verified" : "Unverified"}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-stone-600">
        {user.phone}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-3 text-xs text-stone-500">
          {user.role === "landlord" && (
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {user._count?.ownedProperties ?? 0} props
            </span>
          )}
          {(user.role === "landlord" || user.role === "admin") && (
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {user._count?.agreementsAsLandlord ?? 0} agreements
            </span>
          )}
          {user.role === "admin" && (
            <span className="text-stone-400">
              {user.adminAllLocations
                ? "All locations"
                : `${user.adminSubCities?.join(", ") || "No location"} scope`}
            </span>
          )}
          {user.role === "tenant" && (
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {user._count?.agreementsAsTenant ?? 0} agreements
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        {isLocked ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
            <Lock className="w-3 h-3" /> Locked
          </span>
        ) : (
          <span className="text-xs text-stone-400">Active</span>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-stone-500">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
    </tr>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {[40, 24, 20, 20, 32, 16, 20].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className={`h-4 bg-stone-200 rounded animate-pulse`}
            style={{ width: `${w * 3}px`, maxWidth: "100%" }}
          />
        </td>
      ))}
    </tr>
  );
}

export function UsersPage() {
  const { error: toastError } = useToast();
  const [params, setParams] = useSearchParams();

  const page = Number(params.get("page") ?? 1);
  const roleFilter = (params.get("role") as PlatformRole | null) ?? "";
  const search = params.get("search") ?? "";

  const [inputSearch, setInputSearch] = useState(search);
  const [data, setData] = useState<{
    items: PlatformUser[];
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
    if (roleFilter) p.set("role", roleFilter);
    if (search) p.set("search", search);
    p.set("page", String(page));
    p.set("pageSize", String(PAGE_SIZE));
    return p.toString();
  }, [roleFilter, search, page]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    apiListUsers(token, query)
      .then(setData)
      .catch((e) => toastError(e instanceof Error ? e.message : "Failed to load users"))
      .finally(() => setLoading(false));
  }, [query, toastError]);

  const handleSearch = () => setParam("search", inputSearch.trim());

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900 mb-1">
          User Management
        </h1>
        <p className="text-stone-500 text-sm">
          Browse and inspect all registered platform users.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-3 py-2 flex-1 min-w-48 max-w-sm">
          <Search className="w-4 h-4 text-stone-400" />
          <input
            className="flex-1 text-sm outline-none bg-transparent"
            placeholder="Search name, email, phone…"
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
            onClick={() => setParam("role", "")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${!roleFilter ? "bg-primary-600 text-white border-primary-600" : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"}`}
          >
            All roles
          </button>
          {ALL_ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setParam("role", r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${roleFilter === r ? "bg-primary-600 text-white border-primary-600" : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"}`}
            >
              {ROLE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                {["User", "Role", "Verification", "Phone", "Activity", "Status", "Joined"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))
                : data?.items.map((u) => <UserRow key={u.id} user={u} />)}
              {!loading && data?.items.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-stone-400"
                  >
                    <User className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No users found
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
