import { ApiError } from "@/lib/api-error";
import type {
  AuditLog,
  AuthorityRole,
  Dispute,
  Paginated,
  PlatformUser,
  Property,
  RentAdjustment,
  SystemParameter,
  TenancyAgreement,
  User,
} from "@/lib/types";

const configured = import.meta.env.VITE_API_BASE_URL?.trim();
const useProxy = import.meta.env.VITE_API_USE_PROXY === "1";

function bases(): string[] {
  if (configured) return [configured.replace(/\/$/, "")];
  if (useProxy && typeof window !== "undefined") {
    return [`${window.location.origin}/api-proxy`];
  }
  return ["http://localhost:3000", "http://localhost:3001"];
}

let activeBase: string | null = null;
const ACCESS = "authority_access_token";
const REFRESH = "authority_refresh_token";

export function getAccessToken() {
  return localStorage.getItem(ACCESS);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH);
}

export function setAuthTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS, access);
  localStorage.setItem(REFRESH, refresh);
}

export function clearAuthTokens() {
  localStorage.removeItem(ACCESS);
  localStorage.removeItem(REFRESH);
}

type Opts = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  token?: string | null;
  body?: unknown;
  skipRefresh?: boolean;
};

function toIso(v: unknown) {
  if (typeof v !== "string") return new Date().toISOString();
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function toIsoOptional(v: unknown): string | undefined {
  if (v == null) return undefined;
  if (typeof v !== "string") return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

async function doFetch(path: string, opts: Opts = {}): Promise<Response> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  const candidates = [
    ...(activeBase ? [activeBase] : []),
    ...bases().filter((b) => b !== activeBase),
  ];

  let response: Response | null = null;
  let networkErr: unknown;
  for (const base of candidates) {
    try {
      response = await fetch(`${base}${path}`, {
        method: opts.method ?? "GET",
        headers,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      });
      activeBase = base;
      break;
    } catch (e) {
      networkErr = e;
    }
  }

  if (!response) {
    throw new ApiError(
      `Cannot reach API. Tried: ${candidates.join(", ")}. ${networkErr instanceof Error ? networkErr.message : ""}`,
      0,
    );
  }

  return response;
}

// Token refresh state to avoid concurrent refresh races
let refreshPromise: Promise<string> | null = null;

async function tryRefreshToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await doFetch("/auth/refresh", {
          method: "POST",
          body: { refreshToken: refresh },
          skipRefresh: true,
        });
        if (!res.ok) {
          clearAuthTokens();
          return "";
        }
        const data = (await res.json()) as {
          accessToken: string;
          refreshToken: string;
        };
        setAuthTokens(data.accessToken, data.refreshToken);
        return data.accessToken;
      } catch {
        clearAuthTokens();
        return "";
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

async function apiRequest<T>(path: string, opts: Opts = {}): Promise<T> {
  let response = await doFetch(path, opts);

  // Auto-refresh on 401 (unless this is already a refresh call)
  if (response.status === 401 && !opts.skipRefresh) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      response = await doFetch(path, { ...opts, token: newToken, skipRefresh: true });
    }
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const p = (await response.json()) as { message?: string | string[] };
      if (Array.isArray(p.message)) message = p.message.join(", ");
      else if (p.message) message = p.message;
    } catch {
      /* ignore */
    }
    if (response.status === 401) clearAuthTokens();
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

// ─── Auth ──────────────────────────────────────────────────────────────────

export async function apiLogin(input: {
  email: string;
  password: string;
  role: AuthorityRole;
}) {
  return apiRequest<{
    accessToken: string;
    refreshToken: string;
  }>("/auth/login", {
    method: "POST",
    body: {
      email: input.email.trim().toLowerCase(),
      password: input.password,
      role: input.role,
    },
    skipRefresh: true,
  });
}

export async function apiGetMe(token: string) {
  const raw = await apiRequest<Record<string, unknown>>("/users/me", { token });
  return {
    id: String(raw.id),
    firstName: String(raw.firstName ?? ""),
    lastName: String(raw.lastName ?? ""),
    email: String(raw.email ?? ""),
    phone: String(raw.phone ?? ""),
    role: String(raw.role) as User["role"],
    isVerified: Boolean(raw.isVerified),
    createdAt: toIso(raw.createdAt),
  } satisfies User;
}

export async function apiUpdateMe(
  token: string,
  data: { firstName?: string; lastName?: string; phone?: string; address?: string },
) {
  const raw = await apiRequest<Record<string, unknown>>("/users/me", {
    method: "PATCH",
    token,
    body: data,
  });
  return {
    id: String(raw.id),
    firstName: String(raw.firstName ?? ""),
    lastName: String(raw.lastName ?? ""),
    email: String(raw.email ?? ""),
    phone: String(raw.phone ?? ""),
    role: String(raw.role) as User["role"],
    isVerified: Boolean(raw.isVerified),
    createdAt: toIso(raw.createdAt),
  } satisfies User;
}

export async function apiLogout(token: string) {
  try {
    await apiRequest<void>("/auth/logout", { method: "POST", token });
  } catch {
    // best-effort
  } finally {
    clearAuthTokens();
  }
}

// ─── Properties ────────────────────────────────────────────────────────────

function mapProperty(raw: Record<string, unknown>): Property {
  const landlord = raw.landlord as {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  } | undefined;
  return {
    id: String(raw.id),
    title: String(raw.title ?? ""),
    address: String(raw.address ?? ""),
    subCity: String(raw.subCity ?? ""),
    woreda: String(raw.woreda ?? ""),
    propertyType: String(raw.propertyType ?? ""),
    bedrooms: Number(raw.bedrooms ?? 0),
    bathrooms: Number(raw.bathrooms ?? 0),
    area: Number(raw.area ?? 0),
    monthlyRent: Number(raw.monthlyRent ?? 0),
    status: raw.status as Property["status"],
    landlordId: landlord?.id ?? String(raw.landlordId ?? ""),
    landlordName:
      landlord?.firstName && landlord?.lastName
        ? `${landlord.firstName} ${landlord.lastName}`.trim()
        : "Landlord",
    landlordEmail: landlord?.email,
    landlordPhone: landlord?.phone,
    description: String(raw.description ?? ""),
    amenities: Array.isArray(raw.amenities)
      ? raw.amenities.map(String)
      : [],
    homeCondition: raw.homeCondition ? String(raw.homeCondition) : undefined,
    verifiedAt: toIsoOptional(raw.verifiedAt),
    createdAt: toIso(raw.createdAt),
  };
}

export async function apiListProperties(token: string, query: string) {
  const r = await apiRequest<Paginated<Record<string, unknown>>>(
    `/properties?${query}`,
    { token },
  );
  return { ...r, items: r.items.map(mapProperty) };
}

export async function apiGetProperty(token: string, id: string) {
  const r = await apiRequest<Record<string, unknown>>(`/properties/${id}`, {
    token,
  });
  return mapProperty(r);
}

export async function apiReviewProperty(
  token: string,
  id: string,
  body: { status: "available" | "rejected"; rejectionReason?: string },
) {
  const r = await apiRequest<Record<string, unknown>>(
    `/properties/${id}/review`,
    { method: "PATCH", token, body },
  );
  return mapProperty(r);
}

// ─── Agreements ────────────────────────────────────────────────────────────

function mapAgreement(raw: Record<string, unknown>): TenancyAgreement {
  const landlord = raw.landlord as { id?: string; firstName?: string; lastName?: string };
  const tenant = raw.tenant as { id?: string; firstName?: string; lastName?: string };
  const property = raw.property as { title?: string; address?: string };
  return {
    id: String(raw.id),
    propertyId: String(raw.propertyId),
    propertyTitle: property?.title ?? "Property",
    propertyAddress: property?.address ?? "",
    landlordId: landlord?.id ?? String(raw.landlordId ?? ""),
    landlordName:
      landlord?.firstName && landlord?.lastName
        ? `${landlord.firstName} ${landlord.lastName}`.trim()
        : "Landlord",
    tenantId: tenant?.id ?? String(raw.tenantId ?? ""),
    tenantName:
      tenant?.firstName && tenant?.lastName
        ? `${tenant.firstName} ${tenant.lastName}`.trim()
        : "Tenant",
    monthlyRent: Number(raw.monthlyRent ?? 0),
    advancePayment: Number(raw.advancePayment ?? 0),
    startDate: toIso(raw.startDate),
    endDate: toIso(raw.endDate),
    status: raw.status as TenancyAgreement["status"],
    utilities: Array.isArray(raw.utilities) ? raw.utilities.map(String) : [],
    tenantSignedAt: toIsoOptional(raw.tenantSignedAt),
    verifiedAt: toIsoOptional(raw.verifiedAt),
    createdAt: toIso(raw.createdAt),
    terminationReason: raw.terminationReason
      ? String(raw.terminationReason)
      : undefined,
  };
}

export async function apiListAgreements(token: string, query: string) {
  const r = await apiRequest<Paginated<Record<string, unknown>>>(
    `/agreements?${query}`,
    { token },
  );
  return { ...r, items: r.items.map(mapAgreement) };
}

export async function apiGetAgreement(token: string, id: string) {
  const r = await apiRequest<Record<string, unknown>>(`/agreements/${id}`, {
    token,
  });
  return mapAgreement(r);
}

export async function apiReviewAgreement(
  token: string,
  id: string,
  body: { status: "active" | "rejected"; reason?: string },
) {
  const r = await apiRequest<Record<string, unknown>>(`/agreements/${id}/review`, {
    method: "PATCH",
    token,
    body,
  });
  return mapAgreement(r);
}

// ─── Disputes ──────────────────────────────────────────────────────────────

function mapDispute(raw: Record<string, unknown>): Dispute {
  const reporter = raw.reporter as { firstName?: string; lastName?: string };
  const respondent = raw.respondent as { firstName?: string; lastName?: string };
  const assigned = raw.assignedTo as {
    id?: string;
    firstName?: string;
    lastName?: string;
  };
  const property = raw.property as { id?: string; title?: string };
  return {
    id: String(raw.id),
    agreementId: String(raw.agreementId),
    propertyId: property?.id,
    propertyTitle: property?.title,
    reporterName:
      reporter?.firstName && reporter?.lastName
        ? `${reporter.firstName} ${reporter.lastName}`.trim()
        : "Reporter",
    respondentName:
      respondent?.firstName && respondent?.lastName
        ? `${respondent.firstName} ${respondent.lastName}`.trim()
        : "Respondent",
    violationType: String(raw.violationType ?? ""),
    title: String(raw.title ?? ""),
    description: String(raw.description ?? ""),
    status: raw.status as Dispute["status"],
    priority: (raw.priority as Dispute["priority"]) ?? "medium",
    createdAt: toIso(raw.createdAt),
    resolvedAt: toIsoOptional(raw.resolvedAt),
    resolution: raw.resolution ? String(raw.resolution) : undefined,
    assignedTo:
      assigned?.firstName && assigned?.lastName
        ? `${assigned.firstName} ${assigned.lastName}`.trim()
        : undefined,
    assignedToId: assigned?.id,
  };
}

export async function apiListDisputes(token: string, query: string) {
  const r = await apiRequest<Paginated<Record<string, unknown>>>(
    `/disputes?${query}`,
    { token },
  );
  return { ...r, items: r.items.map(mapDispute) };
}

export async function apiGetDispute(token: string, id: string) {
  return mapDispute(
    await apiRequest<Record<string, unknown>>(`/disputes/${id}`, { token }),
  );
}

export async function apiReviewDispute(
  token: string,
  id: string,
  body: {
    status: Dispute["status"];
    priority?: Dispute["priority"];
    resolution?: string;
    assignedToId?: string;
  },
) {
  return mapDispute(
    await apiRequest<Record<string, unknown>>(`/disputes/${id}/review`, {
      method: "PATCH",
      token,
      body,
    }),
  );
}

// ─── Rent Adjustments ──────────────────────────────────────────────────────

function mapAdjustment(raw: Record<string, unknown>): RentAdjustment {
  const landlord = raw.landlord as { firstName?: string; lastName?: string };
  const agreement = raw.agreement as {
    property?: { title?: string };
  };
  return {
    id: String(raw.id),
    agreementId: String(raw.agreementId),
    propertyTitle: agreement?.property?.title ?? "Property",
    landlordName:
      landlord?.firstName && landlord?.lastName
        ? `${landlord.firstName} ${landlord.lastName}`.trim()
        : "Landlord",
    currentRent: Number(raw.currentRent ?? 0),
    proposedRent: Number(raw.proposedRent ?? 0),
    increasePercentage: Number(raw.increasePercentage ?? 0),
    maxAllowedPercentage: Number(raw.maxAllowedPercentage ?? 7),
    reason: String(raw.reason ?? ""),
    status: raw.status as RentAdjustment["status"],
    createdAt: toIso(raw.createdAt),
    reviewedAt: toIsoOptional(raw.reviewedAt),
    reviewNotes: raw.reviewNotes ? String(raw.reviewNotes) : undefined,
  };
}

export async function apiListRentAdjustments(token: string, query: string) {
  const r = await apiRequest<Paginated<Record<string, unknown>>>(
    `/rent-adjustments?${query}`,
    { token },
  );
  return { ...r, items: r.items.map(mapAdjustment) };
}

export async function apiReviewRentAdjustment(
  token: string,
  id: string,
  body: {
    status: "approved" | "rejected" | "under_review";
    reviewNotes?: string;
  },
) {
  return mapAdjustment(
    await apiRequest<Record<string, unknown>>(
      `/rent-adjustments/${id}/review`,
      { method: "PATCH", token, body },
    ),
  );
}

// ─── Admin: Users ──────────────────────────────────────────────────────────

function mapPlatformUser(raw: Record<string, unknown>): PlatformUser {
  return {
    id: String(raw.id),
    email: String(raw.email ?? ""),
    firstName: String(raw.firstName ?? ""),
    lastName: String(raw.lastName ?? ""),
    phone: String(raw.phone ?? ""),
    role: raw.role as PlatformUser["role"],
    isVerified: Boolean(raw.isVerified),
    faydaVerified: Boolean(raw.faydaVerified),
    createdAt: toIso(raw.createdAt),
    lastLoginAt: toIsoOptional(raw.lastLoginAt),
    lockedUntil: toIsoOptional(raw.lockedUntil),
    _count: raw._count as PlatformUser["_count"],
  };
}

export interface DashboardStats {
  overview: {
    totalProperties: number;
    totalAgreements: number;
    totalDisputes: number;
    totalUsers: number;
    recentProperties: number;
    recentAgreements: number;
    recentDisputes: number;
  };
  propertiesByStatus: { status: string; count: number }[];
  agreementsByStatus: { status: string; count: number }[];
  disputesByStatus: { status: string; count: number }[];
  disputesByPriority: { priority: string; count: number }[];
  adjustmentsByStatus: { status: string; count: number }[];
  usersByRole: { role: string; count: number }[];
  propertiesBySubCity: { subCity: string; count: number }[];
  monthlyTrend: { month: string; properties: number; agreements: number; disputes: number }[];
}

export async function apiGetDashboardStats(token: string): Promise<DashboardStats> {
  return apiRequest<DashboardStats>("/users/admin/stats", { token });
}

export async function apiListUsers(token: string, query: string) {
  const r = await apiRequest<Paginated<Record<string, unknown>>>(
    `/users/admin/list?${query}`,
    { token },
  );
  return { ...r, items: r.items.map(mapPlatformUser) };
}

export async function apiGetUser(token: string, id: string) {
  const r = await apiRequest<Record<string, unknown>>(
    `/users/admin/${id}`,
    { token },
  );
  return mapPlatformUser(r);
}

// ─── Admin: Audit Logs ─────────────────────────────────────────────────────

export async function apiListAuditLogs(token: string, query: string) {
  const r = await apiRequest<Paginated<Record<string, unknown>>>(
    `/users/admin/audit-logs/list?${query}`,
    { token },
  );
  return {
    ...r,
    items: r.items.map(
      (raw): AuditLog => ({
        id: String(raw.id),
        userId: String(raw.userId ?? ""),
        action: String(raw.action ?? ""),
        entity: String(raw.entity ?? ""),
        entityId: String(raw.entityId ?? ""),
        details: String(raw.details ?? ""),
        ipAddress: String(raw.ipAddress ?? ""),
        userAgent: raw.userAgent ? String(raw.userAgent) : undefined,
        timestamp: toIso(raw.timestamp),
        user: raw.user as AuditLog["user"],
      }),
    ),
  };
}

// ─── Admin: System Parameters ──────────────────────────────────────────────

export async function apiListSystemParameters(token: string) {
  const items = await apiRequest<Record<string, unknown>[]>(
    "/users/admin/system-parameters/list",
    { token },
  );
  return items.map(
    (raw): SystemParameter => ({
      id: String(raw.id),
      key: String(raw.key ?? ""),
      label: String(raw.label ?? ""),
      value: String(raw.value ?? ""),
      category: raw.category as SystemParameter["category"],
      description: String(raw.description ?? ""),
      updatedAt: toIso(raw.updatedAt),
      updatedBy: raw.updatedBy as SystemParameter["updatedBy"],
    }),
  );
}

export async function apiUpdateSystemParameter(
  token: string,
  key: string,
  value: string,
) {
  const raw = await apiRequest<Record<string, unknown>>(
    `/users/admin/system-parameters/${encodeURIComponent(key)}`,
    { method: "PATCH", token, body: { value } },
  );
  return {
    id: String(raw.id),
    key: String(raw.key ?? ""),
    label: String(raw.label ?? ""),
    value: String(raw.value ?? ""),
    category: raw.category as SystemParameter["category"],
    description: String(raw.description ?? ""),
    updatedAt: toIso(raw.updatedAt),
    updatedBy: raw.updatedBy as SystemParameter["updatedBy"],
  } satisfies SystemParameter;
}

// ─── Constants ─────────────────────────────────────────────────────────────

export const AUTHORITY_ROLES: AuthorityRole[] = [
  "dara_agent",
  "admin",
  "system_admin",
];

export function isAuthorityRole(role: string): role is AuthorityRole {
  return AUTHORITY_ROLES.includes(role as AuthorityRole);
}
