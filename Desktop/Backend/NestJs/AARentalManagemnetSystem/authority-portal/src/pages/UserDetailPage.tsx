import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Calendar,
  FileText,
  Lock,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
} from "lucide-react";
import { apiGetUser, getAccessToken } from "@/lib/api";
import type { PlatformUser } from "@/lib/types";

const ROLE_LABELS: Record<string, string> = {
  tenant: "Tenant",
  landlord: "Landlord",
  admin: "Admin",
};

const ROLE_COLORS: Record<string, string> = {
  tenant: "bg-sky-100 text-sky-800",
  landlord: "bg-amber-100 text-amber-800",
  admin: "bg-violet-100 text-violet-800",
};

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-stone-100 last:border-0">
      <span className="w-40 flex-shrink-0 text-sm text-stone-500">{label}</span>
      <span className="text-sm text-stone-900 font-medium">{children}</span>
    </div>
  );
}

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<PlatformUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token || !id) return;
    setLoading(true);
    apiGetUser(token, id)
      .then(setUser)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load user"))
      .finally(() => setLoading(false));
  }, [id]);

  const isLocked = user?.lockedUntil && new Date(user.lockedUntil) > new Date();

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-40 bg-stone-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center py-16 text-rose-600">
        <p className="font-medium">{error ?? "User not found"}</p>
        <Link to="/users" className="mt-3 inline-block text-primary-600 text-sm hover:underline">
          Back to users
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/users"
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Users
      </Link>

      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 mb-5">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xl flex-shrink-0">
            {user.firstName[0]?.toUpperCase()}
            {user.lastName[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-3 mb-1">
              <h1 className="text-2xl font-bold text-stone-900">
                {user.firstName} {user.lastName}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[user.role] ?? ROLE_COLORS.admin}`}
              >
                {ROLE_LABELS[user.role]}
              </span>
              {user.role === "admin" && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700">
                  {user.adminAllLocations
                    ? "All Locations"
                    : user.adminSubCities?.join(", ") || "No Location"}
                </span>
              )}
              {isLocked && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-stone-500 mt-2">
              <span className="flex items-center gap-1.5">
                <Mail className="w-4 h-4" /> {user.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-4 h-4" /> {user.phone}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Joined {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Identity & Verification */}
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide mb-4">
            Identity &amp; Verification
          </h2>
          <DetailRow label="Email Verified">
            <span
              className={`flex items-center gap-1.5 ${user.isVerified ? "text-emerald-700" : "text-stone-400"}`}
            >
              {user.isVerified ? (
                <ShieldCheck className="w-4 h-4" />
              ) : (
                <Shield className="w-4 h-4" />
              )}
              {user.isVerified ? "Verified" : "Not verified"}
            </span>
          </DetailRow>
          <DetailRow label="Fayda Verified">
            <span
              className={`flex items-center gap-1.5 ${user.faydaVerified ? "text-emerald-700" : "text-stone-400"}`}
            >
              {user.faydaVerified ? (
                <ShieldCheck className="w-4 h-4" />
              ) : (
                <Shield className="w-4 h-4" />
              )}
              {user.faydaVerified ? "Fayda verified" : "Not verified"}
            </span>
          </DetailRow>
          <DetailRow label="Account Status">
            {isLocked ? (
              <span className="text-rose-600 flex items-center gap-1.5">
                <Lock className="w-4 h-4" />
                Locked until {new Date(user.lockedUntil!).toLocaleString()}
              </span>
            ) : (
              <span className="text-emerald-700">Active</span>
            )}
          </DetailRow>
          <DetailRow label="Last Login">
            {user.lastLoginAt
              ? new Date(user.lastLoginAt).toLocaleString()
              : "Never"}
          </DetailRow>
          <DetailRow label="Member Since">
            {new Date(user.createdAt).toLocaleDateString()}
          </DetailRow>
        </div>

        {/* Activity Summary */}
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide mb-4">
            Activity Summary
          </h2>
          {user.role === "landlord" && (
            <DetailRow label="Properties">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-stone-400" />
                {user._count?.ownedProperties ?? 0} registered
              </span>
            </DetailRow>
          )}
          {(user.role === "landlord" || user.role === "admin") && (
            <DetailRow label="Agreements (as landlord)">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-stone-400" />
                {user._count?.agreementsAsLandlord ?? 0}
              </span>
            </DetailRow>
          )}
          {user.role === "tenant" && (
            <DetailRow label="Agreements (as tenant)">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-stone-400" />
                {user._count?.agreementsAsTenant ?? 0}
              </span>
            </DetailRow>
          )}
          {!user._count && (
            <p className="text-stone-400 text-sm">No activity data available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
