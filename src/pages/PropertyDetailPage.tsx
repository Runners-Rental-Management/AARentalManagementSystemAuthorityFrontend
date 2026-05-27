import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Bath,
  Bed,
  Building2,
  Home,
  Mail,
  MapPin,
  Phone,
  Ruler,
  Tag,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import {
  apiGetProperty,
  apiReviewProperty,
  getAccessToken,
} from "@/lib/api";
import { getErrorMessage } from "@/lib/api-error";
import { useToast } from "@/components/Toast";
import type { Property } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/utils";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: "Apartment",
  house: "House",
  condominium: "Condominium",
  villa: "Villa",
};

const CONDITION_LABELS: Record<string, string> = {
  new_build: "New build",
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  needs_renovation: "Needs renovation",
};

export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [property, setProperty] = useState<Property | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token || !id) return;
    void apiGetProperty(token, id)
      .then(setProperty)
      .catch((e) => setLoadError(getErrorMessage(e)));
  }, [id]);

  const review = async (status: "available" | "rejected") => {
    const token = getAccessToken();
    if (!token || !id) return;
    if (status === "rejected" && rejectionReason.trim().length < 3) {
      setError("Provide a rejection reason (min 3 characters).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiReviewProperty(token, id, {
        status,
        rejectionReason: status === "rejected" ? rejectionReason.trim() : undefined,
      });
      toast.success(
        status === "available"
          ? "Property approved and listed as available."
          : "Property rejected.",
      );
      navigate("/properties?status=pending_verification");
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (!property && !loadError) {
    return (
      <div className="max-w-3xl">
        <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse space-y-4">
          <div className="h-6 bg-slate-100 rounded w-1/2" />
          <div className="h-4 bg-slate-100 rounded w-1/3" />
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <Link
        to="/properties"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to properties
      </Link>

      {loadError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700">
          {loadError}
        </div>
      )}

      {property && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {property.title}
                </h1>
                <p className="text-slate-500 text-sm mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {property.address}
                </p>
              </div>
              <StatusBadge value={property.status} />
            </div>
          </div>

          {/* Quick stats */}
          <div className="px-6 py-4 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Bed className="w-4 h-4 text-slate-400" />
              <span>{property.bedrooms} bed{property.bedrooms !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Bath className="w-4 h-4 text-slate-400" />
              <span>{property.bathrooms} bath{property.bathrooms !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Ruler className="w-4 h-4 text-slate-400" />
              <span>{property.area} m²</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
              <Tag className="w-4 h-4" />
              <span>{formatMoney(property.monthlyRent)}/mo</span>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 grid sm:grid-cols-2 gap-6 border-b border-slate-100">
            <div className="space-y-4">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5" />
                Property details
              </h2>
              <dl className="space-y-3">
                <DetailRow
                  label="Type"
                  value={PROPERTY_TYPE_LABELS[property.propertyType] ?? property.propertyType}
                />
                <DetailRow
                  label="Location"
                  value={`${property.subCity} sub-city, Woreda ${property.woreda}`}
                />
                {property.homeCondition && (
                  <DetailRow
                    label="Condition"
                    value={CONDITION_LABELS[property.homeCondition] ?? property.homeCondition}
                  />
                )}
                <DetailRow
                  label="Listed"
                  value={formatDate(property.createdAt)}
                />
                {property.verifiedAt && (
                  <DetailRow
                    label="Verified"
                    value={formatDate(property.verifiedAt)}
                  />
                )}
              </dl>
            </div>

            <div className="space-y-4">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Landlord
              </h2>
              <dl className="space-y-3">
                <DetailRow label="Name" value={property.landlordName} />
                {property.landlordEmail && (
                  <DetailRow
                    label="Email"
                    value={
                      <a
                        href={`mailto:${property.landlordEmail}`}
                        className="flex items-center gap-1 text-indigo-600 hover:underline"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        {property.landlordEmail}
                      </a>
                    }
                  />
                )}
                {property.landlordPhone && (
                  <DetailRow
                    label="Phone"
                    value={
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {property.landlordPhone}
                      </span>
                    }
                  />
                )}
              </dl>
            </div>

            {/* Description */}
            {property.description && (
              <div className="col-span-full space-y-2">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Description
                </h2>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {property.description}
                </p>
              </div>
            )}

            {/* Amenities */}
            {property.amenities.length > 0 && (
              <div className="col-span-full space-y-2">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Amenities
                </h2>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((a) => (
                    <span
                      key={a}
                      className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 capitalize"
                    >
                      {a.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Review actions */}
          {property.status === "pending_verification" && (
            <div className="p-6 bg-slate-50 space-y-4">
              <h2 className="text-sm font-semibold text-slate-700">
                Authority review
              </h2>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Rejection reason
                  <span className="text-slate-400 ml-1">(required if rejecting)</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="State the reason for rejecting this property listing…"
                />
              </div>

              {error && (
                <div className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => review("available")}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  {busy ? "Processing…" : "Approve listing"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => review("rejected")}
                  className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  {busy ? "Processing…" : "Reject listing"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
