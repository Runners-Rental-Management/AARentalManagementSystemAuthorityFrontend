import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  FileCheck,
  Gavel,
  Home,
  RefreshCw,
  TrendingUp,
  Users,
  Building2,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/context/AuthContext";
import {
  apiGetDashboardStats,
  apiListAgreements,
  apiListDisputes,
  apiListProperties,
  apiListRentAdjustments,
  type DashboardStats,
  getAccessToken,
} from "@/lib/api";

// ─── Colour palettes ────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  pending_verification: "#f59e0b",
  available: "#10b981",
  rejected: "#ef4444",
  rented: "#6366f1",
  draft: "#94a3b8",
  pending_tenant_signature: "#f97316",
  pending_dara_verification: "#8b5cf6",
  active: "#10b981",
  extended: "#06b6d4",
  terminated: "#64748b",
  expired: "#475569",
  open: "#ef4444",
  under_review: "#f59e0b",
  mediation: "#8b5cf6",
  resolved: "#10b981",
  closed: "#64748b",
  escalated: "#dc2626",
  pending: "#f59e0b",
  approved: "#10b981",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
};

const ROLE_COLORS: Record<string, string> = {
  tenant: "#6366f1",
  landlord: "#f59e0b",
  admin: "#8b5cf6",
  dara_agent: "#06b6d4",
  system_admin: "#ef4444",
};

const PIE_PALETTE = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#64748b"];

// ─── Helper components ───────────────────────────────────────────────────────

function ChartCard({ title, subtitle, children, className = "" }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-5 ${className}`}>
      <div className="mb-4">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function KpiCard({ label, value, sub, icon: Icon, color, to, trend }: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  to: string;
  trend?: number;
}) {
  return (
    <Link
      to={to}
      className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all group flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trend >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
            {trend >= 0 ? "+" : ""}{trend} this month
          </span>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold text-slate-900 leading-none">{value}</p>
        <p className="text-sm text-slate-500 mt-1 group-hover:text-slate-700 transition-colors">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </Link>
  );
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl">
      {label && <p className="font-semibold mb-1 text-slate-300">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-bold text-white">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

type ActionStats = {
  pendingAgreements: number;
  pendingDaraAgreements: number;
  pendingProperties: number;
  openDisputes: number;
  underReviewDisputes: number;
  pendingAdjustments: number;
};

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [actionStats, setActionStats] = useState<ActionStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    Promise.all([
      apiGetDashboardStats(token),
      Promise.all([
        apiListAgreements(token, "status=pending_verification&pageSize=1"),
        apiListAgreements(token, "status=pending_dara_verification&pageSize=1"),
        apiListProperties(token, "status=pending_verification&pageSize=1"),
        apiListDisputes(token, "status=open&pageSize=1"),
        apiListDisputes(token, "status=under_review&pageSize=1"),
        apiListRentAdjustments(token, "status=pending&pageSize=1"),
      ]).then(([pa, pda, pp, od, urd, padj]) => ({
        pendingAgreements: pa.meta.total,
        pendingDaraAgreements: pda.meta.total,
        pendingProperties: pp.meta.total,
        openDisputes: od.meta.total,
        underReviewDisputes: urd.meta.total,
        pendingAdjustments: padj.meta.total,
      })),
    ])
      .then(([dashStats, acts]) => {
        setStats(dashStats);
        setActionStats(acts);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const totalActions = actionStats
    ? actionStats.pendingAgreements +
      actionStats.pendingDaraAgreements +
      actionStats.pendingProperties +
      actionStats.openDisputes +
      actionStats.pendingAdjustments
    : null;

  const SkeletonBlock = ({ h = "h-64" }: { h?: string }) => (
    <div className={`${h} bg-slate-200 rounded-2xl animate-pulse`} />
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {user?.firstName}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Addis Ababa Rental Authority — Operations Overview
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-500" : "text-slate-500"}`} />
          Refresh
        </button>
      </div>

      {/* Action required banner */}
      {totalActions != null && totalActions > 0 && (
        <div className="px-5 py-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-amber-900 text-sm">
              {totalActions} item{totalActions !== 1 ? "s" : ""} require your attention
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Pending agreements, property reviews, disputes, and rent adjustments need review.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="px-5 py-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={load} className="text-rose-600 font-medium hover:underline ml-4">
            Retry
          </button>
        </div>
      )}

      {/* KPI grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} h="h-32" />)}
        </div>
      ) : stats && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            label="Total Properties"
            value={stats.overview.totalProperties}
            sub="Registered on platform"
            icon={Home}
            color="text-amber-600 bg-amber-50"
            to="/properties"
            trend={stats.overview.recentProperties}
          />
          <KpiCard
            label="Tenancy Agreements"
            value={stats.overview.totalAgreements}
            sub="All time"
            icon={FileCheck}
            color="text-indigo-600 bg-indigo-50"
            to="/agreements"
            trend={stats.overview.recentAgreements}
          />
          <KpiCard
            label="Active Disputes"
            value={stats.disputesByStatus.find((d) => d.status === "open")?.count ?? 0}
            sub="Requiring resolution"
            icon={Gavel}
            color="text-rose-600 bg-rose-50"
            to="/disputes?status=open"
            trend={stats.overview.recentDisputes}
          />
          <KpiCard
            label="Platform Users"
            value={stats.overview.totalUsers}
            sub="Landlords, tenants & staff"
            icon={Users}
            color="text-emerald-600 bg-emerald-50"
            to="/users"
          />
        </div>
      )}

      {/* Action items grid */}
      {actionStats && (
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              label: "Agreements awaiting verification",
              value: actionStats.pendingAgreements,
              to: "/agreements?status=pending_verification",
              icon: FileCheck,
              color: "text-indigo-600 bg-indigo-50",
              urgent: actionStats.pendingAgreements > 0,
            },
            {
              label: "Properties pending review",
              value: actionStats.pendingProperties,
              to: "/properties?status=pending_verification",
              icon: Building2,
              color: "text-amber-600 bg-amber-50",
              urgent: actionStats.pendingProperties > 0,
            },
            {
              label: "Pending rent adjustments",
              value: actionStats.pendingAdjustments,
              to: "/rent-adjustments?status=pending",
              icon: TrendingUp,
              color: "text-emerald-600 bg-emerald-50",
              urgent: actionStats.pendingAdjustments > 0,
            },
          ].map(({ label, value, to, icon: Icon, color, urgent }) => (
            <Link
              key={to}
              to={to}
              className={`bg-white border rounded-xl p-4 hover:shadow-md transition-all flex items-center gap-3 ${urgent ? "border-amber-200 hover:border-amber-300" : "border-slate-200 hover:border-slate-300"}`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500 truncate">{label}</p>
              </div>
              {urgent && value > 0 && (
                <div className="ml-auto w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Charts row 1: Monthly trend + Properties by sub-city */}
      {loading ? (
        <div className="grid xl:grid-cols-2 gap-5">
          <SkeletonBlock h="h-72" />
          <SkeletonBlock h="h-72" />
        </div>
      ) : stats && (
        <div className="grid xl:grid-cols-2 gap-5">
          <ChartCard
            title="Platform Activity — Last 6 Months"
            subtitle="New properties, agreements, and disputes registered monthly"
          >
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={stats.monthlyTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gProp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gAgr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gDisp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Area type="monotone" dataKey="properties" name="Properties" stroke="#f59e0b" strokeWidth={2} fill="url(#gProp)" dot={false} />
                <Area type="monotone" dataKey="agreements" name="Agreements" stroke="#6366f1" strokeWidth={2} fill="url(#gAgr)" dot={false} />
                <Area type="monotone" dataKey="disputes" name="Disputes" stroke="#ef4444" strokeWidth={2} fill="url(#gDisp)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Properties by Sub-City"
            subtitle="Distribution of registered properties across Addis Ababa"
          >
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.propertiesBySubCity} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="subCity" type="category" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Properties" radius={[0, 4, 4, 0]}>
                  {stats.propertiesBySubCity.map((_, i) => (
                    <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Charts row 2: Status distributions */}
      {loading ? (
        <div className="grid xl:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonBlock key={i} h="h-60" />)}
        </div>
      ) : stats && (
        <div className="grid xl:grid-cols-3 gap-5">
          {/* Properties by status */}
          <ChartCard title="Properties by Status" subtitle="Current verification & occupancy breakdown">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={stats.propertiesByStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                >
                  {stats.propertiesByStatus.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.status] ?? PIE_PALETTE[i % PIE_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, name) => [v, String(name).replace(/_/g, " ")]}
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                />
                <Legend
                  formatter={(v) => String(v).replace(/_/g, " ")}
                  wrapperStyle={{ fontSize: 10 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Agreements by status */}
          <ChartCard title="Agreements by Status" subtitle="Current pipeline of tenancy agreements">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={stats.agreementsByStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                >
                  {stats.agreementsByStatus.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.status] ?? PIE_PALETTE[i % PIE_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, name) => [v, String(name).replace(/_/g, " ")]}
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                />
                <Legend
                  formatter={(v) => String(v).replace(/_/g, " ")}
                  wrapperStyle={{ fontSize: 10 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Disputes by priority */}
          <ChartCard title="Disputes by Priority" subtitle="Current open dispute urgency levels">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.disputesByPriority} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="priority" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Disputes" radius={[4, 4, 0, 0]}>
                  {stats.disputesByPriority.map((entry, i) => (
                    <Cell key={i} fill={PRIORITY_COLORS[entry.priority] ?? PIE_PALETTE[i % PIE_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Charts row 3: Users by role + Adjustments + Dispute Status */}
      {loading ? (
        <div className="grid xl:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonBlock key={i} h="h-56" />)}
        </div>
      ) : stats && (
        <div className="grid xl:grid-cols-3 gap-5">
          {/* Users by role */}
          <ChartCard title="Users by Role" subtitle="Platform user distribution">
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie
                  data={stats.usersByRole}
                  dataKey="count"
                  nameKey="role"
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  paddingAngle={3}
                >
                  {stats.usersByRole.map((entry, i) => (
                    <Cell key={i} fill={ROLE_COLORS[entry.role] ?? PIE_PALETTE[i % PIE_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, name) => [v, String(name).replace(/_/g, " ")]}
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                />
                <Legend
                  formatter={(v) => String(v).replace(/_/g, " ")}
                  wrapperStyle={{ fontSize: 10 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Rent adjustments */}
          <ChartCard title="Rent Adjustment Requests" subtitle="Status of landlord rent increase requests">
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={stats.adjustmentsByStatus} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="status" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => v.replace(/_/g, " ")} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Requests" radius={[4, 4, 0, 0]}>
                  {stats.adjustmentsByStatus.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.status] ?? PIE_PALETTE[i % PIE_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Disputes by status */}
          <ChartCard title="Disputes by Status" subtitle="Resolution pipeline overview">
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={stats.disputesByStatus} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="status" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => v.replace(/_/g, " ")} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Disputes" radius={[4, 4, 0, 0]}>
                  {stats.disputesByStatus.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.status] ?? PIE_PALETTE[i % PIE_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Quick actions */}
      {!loading && (
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-5 h-5 text-indigo-200" />
            <h3 className="font-semibold">Quick Actions</h3>
          </div>
          <div className="grid sm:grid-cols-4 gap-3">
            {[
              { label: "Review pending agreements", to: "/agreements?status=pending_verification", count: actionStats?.pendingAgreements },
              { label: "Verify properties", to: "/properties?status=pending_verification", count: actionStats?.pendingProperties },
              { label: "Handle open disputes", to: "/disputes?status=open", count: actionStats?.openDisputes },
              { label: "Approve rent adjustments", to: "/rent-adjustments?status=pending", count: actionStats?.pendingAdjustments },
            ].map(({ label, to, count }) => (
              <Link
                key={to}
                to={to}
                className="bg-white/10 hover:bg-white/20 rounded-xl px-4 py-3 text-sm font-medium transition-colors flex items-center justify-between gap-2"
              >
                <span className="leading-snug">{label}</span>
                {count !== undefined && count > 0 && (
                  <span className="bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full shrink-0">{count}</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
