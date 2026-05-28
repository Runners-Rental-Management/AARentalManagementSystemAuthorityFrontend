import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Bath,
  Bed,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ExternalLink,
  FileText,
  Home,
  Image,
  Info,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Ruler,
  Sparkles,
  Tag,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import {
  apiGetProperty,
  apiPredictPrice,
  apiReviewProperty,
  getAccessToken,
  type PricePredictionResult,
} from "@/lib/api";
import { getErrorMessage } from "@/lib/api-error";
import { useToast } from "@/components/Toast";
import type { Property } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/utils";
import { computeListingRange, classifyRent } from "@/lib/addis-rent-benchmarks";
import { listingRangeFromMlPrediction, mlSourceLabel } from "@/lib/ml-price-range";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-stone-500 uppercase tracking-wide">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-stone-900">{value}</dd>
    </div>
  );
}

function fmtETB(n: number) {
  return `${Math.round(n).toLocaleString()} ETB`;
}

function pct(value: number, min: number, max: number) {
  if (max === min) return 50;
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

function MarketPricePanel({ property }: { property: Property }) {
  const areaSqm = typeof property.area === "number" ? property.area : parseFloat(String(property.area)) || 0;
  const rent = typeof property.monthlyRent === "number" ? property.monthlyRent : parseFloat(String(property.monthlyRent)) || 0;
  const [showDetail, setShowDetail] = useState(false);
  const [mlPrediction, setMlPrediction] = useState<PricePredictionResult | null>(null);
  const [mlLoading, setMlLoading] = useState(true);
  const [mlError, setMlError] = useState<string | null>(null);

  const benchmarkRange = useMemo(
    () => computeListingRange(property.subCity, property.propertyType, areaSqm),
    [property.subCity, property.propertyType, areaSqm],
  );

  useEffect(() => {
    let cancelled = false;
    const token = getAccessToken();
    if (!token || areaSqm <= 0) {
      setMlLoading(false);
      return;
    }

    setMlLoading(true);
    setMlError(null);
    apiPredictPrice(token, property)
      .then((result) => {
        if (!cancelled) setMlPrediction(result);
      })
      .catch((err) => {
        if (!cancelled) {
          setMlPrediction(null);
          setMlError(getErrorMessage(err));
        }
      })
      .finally(() => {
        if (!cancelled) setMlLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    property.id,
    property.subCity,
    property.propertyType,
    property.bedrooms,
    property.bathrooms,
    property.area,
    property.homeCondition,
    property.amenities,
    areaSqm,
  ]);

  const range = useMemo(() => {
    if (mlPrediction) {
      return listingRangeFromMlPrediction(mlPrediction, areaSqm);
    }
    return benchmarkRange;
  }, [mlPrediction, benchmarkRange, areaSqm]);

  if (mlLoading && !range) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-6 flex flex-col items-center gap-3 text-stone-500">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        <p className="text-xs font-medium">Loading ML price prediction…</p>
      </div>
    );
  }

  if (!range) {
    return (
      <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs text-stone-500">
        {mlError
          ? `Price prediction unavailable: ${mlError}`
          : "Market reference unavailable for this sub-city / property type combination."}
      </div>
    );
  }

  const classification = classifyRent(rent, range);
  const valuePct = pct(rent, range.floor, range.ceiling);
  const recMinPct = pct(range.recommendedMin, range.floor, range.ceiling);
  const recMaxPct = pct(range.recommendedMax, range.floor, range.ceiling);

  const verdict = (() => {
    switch (classification) {
      case "within_band":
        return {
          icon: <CheckCircle2 className="w-4 h-4" />,
          label: "Within market range",
          note: "This rent falls within the indicative market band for this area and property type.",
          bg: "bg-emerald-50 border-emerald-200",
          text: "text-emerald-800",
          badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
          bar: "bg-emerald-500",
        };
      case "below_band":
        return {
          icon: <TrendingDown className="w-4 h-4" />,
          label: "Below typical market rate",
          note: "The listed rent is below the indicative market range. This may be intentional or indicate underpricing.",
          bg: "bg-sky-50 border-sky-200",
          text: "text-sky-800",
          badge: "bg-sky-100 text-sky-800 border-sky-200",
          bar: "bg-sky-400",
        };
      case "above_band":
        return {
          icon: <TrendingUp className="w-4 h-4" />,
          label: "Above typical market rate",
          note: "The listed rent exceeds the indicative upper band. Review carefully before approving.",
          bg: "bg-amber-50 border-amber-200",
          text: "text-amber-800",
          badge: "bg-amber-100 text-amber-800 border-amber-200",
          bar: "bg-amber-400",
        };
      case "below_floor":
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          label: "Significantly below floor",
          note: "This rent is far below the absolute floor for this area. Verify with the landlord.",
          bg: "bg-rose-50 border-rose-200",
          text: "text-rose-800",
          badge: "bg-rose-100 text-rose-800 border-rose-200",
          bar: "bg-rose-400",
        };
      case "above_ceiling":
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          label: "Exceeds absolute ceiling",
          note: "This rent exceeds the absolute upper limit for this area. Rejection is strongly recommended.",
          bg: "bg-rose-50 border-rose-200",
          text: "text-rose-800",
          badge: "bg-rose-100 text-rose-800 border-rose-200",
          bar: "bg-rose-500",
        };
    }
  })();

  const perSqm = areaSqm > 0 ? Math.round(rent / areaSqm) : null;

  return (
    <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-700 to-violet-700 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary-200 shrink-0" />
          <p className="text-white font-bold text-sm">
            {mlPrediction ? "ML Market Price Prediction" : "Market Price Reference"}
          </p>
        </div>
        <p className="text-primary-200 text-xs mt-0.5">
          {property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1)} · {property.subCity} · {areaSqm > 0 ? `${areaSqm} m²` : "unknown area"}
        </p>
        {mlPrediction && (
          <p className="text-primary-100/90 text-[10px] mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-full bg-white/15 px-2 py-0.5 font-semibold uppercase tracking-wide">
              {mlSourceLabel(mlPrediction.source)}
            </span>
            <span>Confidence: {mlPrediction.confidence}</span>
          </p>
        )}
        {mlLoading && (
          <p className="text-primary-100/80 text-[10px] mt-1 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" /> Refreshing prediction…
          </p>
        )}
        {mlError && !mlPrediction && (
          <p className="text-amber-200 text-[10px] mt-1">Using static benchmarks (ML: {mlError})</p>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Verdict badge */}
        <div className={`rounded-lg border px-3 py-2.5 flex items-start gap-2.5 ${verdict.bg}`}>
          <span className={verdict.text}>{verdict.icon}</span>
          <div>
            <p className={`text-xs font-bold ${verdict.text}`}>{verdict.label}</p>
            <p className={`text-xs mt-0.5 leading-relaxed ${verdict.text} opacity-80`}>{verdict.note}</p>
          </div>
        </div>

        {/* Listed rent */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-stone-500">Listed rent</span>
          <span className="text-base font-bold text-stone-900">{fmtETB(rent)}<span className="text-xs font-normal text-stone-500"> /mo</span></span>
        </div>

        {perSqm !== null && (
          <div className="flex items-center justify-between -mt-2">
            <span className="text-xs font-medium text-stone-400">Per m²</span>
            <span className="text-xs font-semibold text-stone-600">{perSqm.toLocaleString()} ETB / m²</span>
          </div>
        )}

        {/* Visual bar */}
        <div>
          <div className="relative h-3 rounded-full overflow-hidden bg-stone-100">
            {/* below-band zone (sky) */}
            <div
              className="absolute top-0 bottom-0 bg-sky-100"
              style={{ left: 0, right: `${100 - recMaxPct}%` }}
            />
            {/* within-band zone (emerald) */}
            <div
              className="absolute top-0 bottom-0 bg-emerald-200"
              style={{ left: `${recMinPct}%`, right: `${100 - recMaxPct}%` }}
            />
            {/* above-band zone (amber) */}
            <div
              className="absolute top-0 bottom-0 bg-amber-100"
              style={{ left: `${recMaxPct}%`, right: 0 }}
            />
            {/* band boundary markers */}
            <div className="absolute top-0 bottom-0 w-0.5 bg-emerald-500" style={{ left: `${recMinPct}%` }} />
            <div className="absolute top-0 bottom-0 w-0.5 bg-emerald-500" style={{ left: `${recMaxPct}%` }} />
            {/* listed rent indicator */}
            <div
              className={`absolute top-0 bottom-0 w-1.5 rounded-full ${verdict.bar} shadow`}
              style={{ left: `calc(${valuePct}% - 3px)` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-stone-400 mt-1 font-medium">
            <span>{fmtETB(range.floor)}</span>
            <span>{fmtETB(range.ceiling)}</span>
          </div>
        </div>

        {/* 3 reference cards */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-stone-50 border border-stone-200 px-2 py-2">
            <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Floor</p>
            <p className="text-xs font-bold text-stone-700 mt-0.5">{fmtETB(range.floor)}</p>
          </div>
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-2">
            <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Typical</p>
            <p className="text-xs font-bold text-emerald-800 mt-0.5">{fmtETB(range.mid)}</p>
          </div>
          <div className="rounded-lg bg-stone-50 border border-stone-200 px-2 py-2">
            <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Ceiling</p>
            <p className="text-xs font-bold text-stone-700 mt-0.5">{fmtETB(range.ceiling)}</p>
          </div>
        </div>

        {/* Recommended band */}
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Info className="w-3 h-3 text-emerald-700" />
            <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
              {mlPrediction ? "Predicted fair rent (ML)" : "Market Band for This Unit"}
            </p>
          </div>
          <p className="text-sm font-bold text-emerald-900">
            {fmtETB(range.recommendedMin)} – {fmtETB(range.recommendedMax)}
          </p>
          {mlPrediction && (
            <p className="text-xs font-semibold text-emerald-800 mt-0.5">
              Median: {fmtETB(mlPrediction.predictedMedian)}
            </p>
          )}
          <p className="text-[10px] text-emerald-700 mt-0.5">
            {range.perSqmMin}–{range.perSqmMax} ETB / m²
            {!mlPrediction && ` · area factor ×${range.areaFactor}`}
          </p>
          {mlPrediction?.note && (
            <p className="text-[10px] text-emerald-600 mt-1 leading-relaxed">{mlPrediction.note}</p>
          )}
        </div>

        {/* Expandable detail */}
        <button
          type="button"
          onClick={() => setShowDetail((v) => !v)}
          className="w-full flex items-center justify-between text-xs font-medium text-stone-500 hover:text-primary-600 transition-colors pt-1"
        >
          <span>How is this calculated?</span>
          {showDetail ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showDetail && (
          <div className="space-y-2 text-[11px] text-stone-600 leading-relaxed border-t border-stone-100 pt-3">
            {mlPrediction ? (
              <>
                <p>
                  <span className="font-semibold text-stone-700">ML service</span> predicts monthly rent from sub-city, property type, {property.bedrooms} bed / {property.bathrooms} bath, {areaSqm} m², and condition ({property.homeCondition ?? "good"}).
                </p>
                <p>
                  <span className="font-semibold text-stone-700">Listed vs predicted</span>: compare the landlord&apos;s {fmtETB(rent)} to the predicted band before approve/reject.
                </p>
                <p>
                  <span className="font-semibold text-stone-700">Source</span>: {mlSourceLabel(mlPrediction.source)} via backend → ML microservice (port 8000).
                </p>
              </>
            ) : (
              <>
                <p><span className="font-semibold text-stone-700">Base band</span> ({property.propertyType} in {property.subCity}): <span className="font-mono">{fmtETB(range.baseMin)} – {fmtETB(range.baseMax)}</span> / month for a typical-size unit.</p>
                <p><span className="font-semibold text-stone-700">Area adjustment</span>: ×{range.areaFactor} (√({areaSqm} ÷ reference area)) — larger units scale sub-linearly, matching Addis market behaviour.</p>
                <p><span className="font-semibold text-stone-700">Source</span>: 2026 Addis Ababa static benchmarks (ML service unavailable).</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Photo gallery ──────────────────────────────────────────────────────── */

function PropertyPhotos({ images }: { images: string[] }) {
  const [active, setActive] = useState(0);

  const validImages = images.filter((url) => url && !url.startsWith("blob:"));

  if (validImages.length === 0) {
    return (
      <div className="border-t border-stone-100 px-6 py-5">
        <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
          <Image className="w-3.5 h-3.5" />
          Property photos
        </h2>
        <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50 flex flex-col items-center justify-center py-8 gap-2">
          <Image className="w-8 h-8 text-stone-300" />
          <p className="text-xs text-stone-400">No photos available for preview</p>
          <p className="text-[11px] text-stone-300">Photos are stored as local previews and cannot be displayed here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-stone-100 px-6 py-5">
      <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
        <Image className="w-3.5 h-3.5" />
        Property photos
        <span className="ml-auto text-[10px] font-normal normal-case text-stone-400">
          {active + 1} / {validImages.length}
        </span>
      </h2>

      {/* Main image */}
      <div className="relative rounded-xl overflow-hidden bg-stone-100 aspect-video mb-2">
        <img
          src={validImages[active]}
          alt={`Property photo ${active + 1}`}
          className="w-full h-full object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = ""; }}
        />
        {validImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setActive((v) => (v - 1 + validImages.length) % validImages.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setActive((v) => (v + 1) % validImages.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {validImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {validImages.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                i === active ? "border-primary-500 ring-2 ring-primary-200" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img src={url} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Ownership documents ────────────────────────────────────────────────── */

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function OwnershipDocuments({ documents }: { documents: import("@/lib/types").PropertyDocument[] }) {
  if (documents.length === 0) {
    return (
      <div className="border-t border-stone-100 px-6 py-5">
        <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
          <FileText className="w-3.5 h-3.5" />
          Proof of ownership documents
        </h2>
        <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50 flex flex-col items-center justify-center py-6 gap-2">
          <FileText className="w-7 h-7 text-stone-300" />
          <p className="text-xs text-stone-400">No ownership documents uploaded</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-stone-100 px-6 py-5">
      <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
        <FileText className="w-3.5 h-3.5" />
        Proof of ownership documents
        <span className="ml-auto text-[10px] font-normal normal-case text-stone-400">
          {documents.length} file{documents.length !== 1 ? "s" : ""}
        </span>
      </h2>
      <div className="space-y-2">
        {documents.map((doc) => {
          const isImage = doc.fileType.startsWith("image/");
          const isPdf = doc.fileType === "application/pdf";
          return (
            <div
              key={doc.id}
              className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3"
            >
              <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                {isImage ? (
                  <Image className="w-4 h-4 text-primary-600" />
                ) : (
                  <FileText className="w-4 h-4 text-primary-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-800 truncate">{doc.fileName}</p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  {isPdf ? "PDF document" : isImage ? "Image" : doc.fileType} · {formatBytes(doc.fileSize)}
                  {doc.description && ` · ${doc.description}`}
                </p>
              </div>
              <a
                href={doc.storageKey}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-800 transition-colors"
                title="Open document"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View
              </a>
            </div>
          );
        })}
      </div>
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

  const isPending = property?.status === "pending_verification";

  if (!property && !loadError) {
    return (
      <div className="max-w-4xl">
        <div className="bg-white rounded-xl border border-stone-200 p-6 animate-pulse space-y-4">
          <div className="h-6 bg-stone-100 rounded w-1/2" />
          <div className="h-4 bg-stone-100 rounded w-1/3" />
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 bg-stone-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <Link
        to="/properties"
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-primary-600 mb-5 transition-colors"
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
        /* When pending: two-column layout — property card left, market panel + review form right */
        <div className={isPending ? "grid lg:grid-cols-[1fr_340px] gap-5 items-start" : ""}>
          {/* ── Left / main column ── */}
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-stone-100">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-stone-900">
                    {property.title}
                  </h1>
                  <p className="text-stone-500 text-sm mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {property.address}
                  </p>
                </div>
                <StatusBadge value={property.status} />
              </div>
            </div>

            {/* Quick stats */}
            <div className="px-6 py-4 border-b border-stone-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 text-sm text-stone-600">
                <Bed className="w-4 h-4 text-stone-400" />
                <span>{property.bedrooms} bed{property.bedrooms !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-stone-600">
                <Bath className="w-4 h-4 text-stone-400" />
                <span>{property.bathrooms} bath{property.bathrooms !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-stone-600">
                <Ruler className="w-4 h-4 text-stone-400" />
                <span>{property.area} m²</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-primary-700">
                <Tag className="w-4 h-4" />
                <span>{formatMoney(property.monthlyRent)}/mo</span>
              </div>
            </div>

            {/* Details */}
            <div className="p-6 grid sm:grid-cols-2 gap-6 border-b border-stone-100">
              <div className="space-y-4">
                <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
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
                <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
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
                          className="flex items-center gap-1 text-primary-600 hover:underline"
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
                          <Phone className="w-3.5 h-3.5 text-stone-400" />
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
                  <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                    Description
                  </h2>
                  <p className="text-sm text-stone-700 leading-relaxed">
                    {property.description}
                  </p>
                </div>
              )}

              {/* Amenities */}
              {property.amenities.length > 0 && (
                <div className="col-span-full space-y-2">
                  <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                    Amenities
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.map((a) => (
                      <span
                        key={a}
                        className="px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-700 capitalize"
                      >
                        {a.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Property photos ── */}
            <PropertyPhotos images={property.images} />

            {/* ── Ownership documents ── */}
            <OwnershipDocuments documents={property.documents} />

          </div>

          {/* ── Right column: market panel + review form (only when pending) ── */}
          {isPending && (
            <div className="space-y-4">
              <MarketPricePanel property={property} />

              {/* Review form */}
              <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-4">
                <h2 className="text-sm font-semibold text-stone-800 flex items-center gap-2">
                  Authority review
                </h2>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1.5">
                    Rejection reason
                    <span className="text-stone-400 ml-1">(required if rejecting)</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                    placeholder="State the reason for rejecting this property listing…"
                  />
                </div>

                {error && (
                  <div className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => review("available")}
                    className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                  >
                    {busy ? "Processing…" : "✓  Approve listing"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => review("rejected")}
                    className="w-full py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                  >
                    {busy ? "Processing…" : "✕  Reject listing"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
