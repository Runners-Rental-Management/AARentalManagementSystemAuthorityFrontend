import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, DollarSign, FileText, Home, User } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import {
  apiGetAgreement,
  apiReviewAgreement,
  getAccessToken,
} from "@/lib/api";
import { getErrorMessage } from "@/lib/api-error";
import { useToast } from "@/components/Toast";
import type { TenancyAgreement } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/utils";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}

export function AgreementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [agreement, setAgreement] = useState<TenancyAgreement | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token || !id) return;
    void apiGetAgreement(token, id)
      .then(setAgreement)
      .catch((e) => setError(getErrorMessage(e)));
  }, [id]);

  const isPendingVerification =
    agreement?.status === "pending_verification" ||
    agreement?.status === "pending_dara_verification";

  const review = async (status: "active" | "rejected") => {
    const token = getAccessToken();
    if (!token || !id) return;
    if (status === "rejected" && reason.trim().length < 3) {
      setError("Provide a rejection reason (min 3 characters).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiReviewAgreement(token, id, {
        status,
        reason: status === "rejected" ? reason.trim() : undefined,
      });
      toast.success(
        status === "active"
          ? "Agreement approved and activated."
          : "Agreement rejected.",
      );
      navigate("/agreements?status=pending_verification");
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (!agreement && !error) {
    return (
      <div className="max-w-3xl">
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 animate-pulse">
          <div className="h-6 bg-slate-100 rounded w-1/2" />
          <div className="h-4 bg-slate-100 rounded w-1/3" />
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            {Array.from({ length: 6 }).map((_, i) => (
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
        to="/agreements"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to agreements
      </Link>

      {error && !agreement && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {agreement && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {agreement.propertyTitle}
                </h1>
                <p className="text-slate-500 text-sm mt-0.5 flex items-center gap-1">
                  <Home className="w-3.5 h-3.5" />
                  {agreement.propertyAddress}
                </p>
              </div>
              <StatusBadge value={agreement.status} />
            </div>
          </div>

          {/* Details Grid */}
          <div className="p-6 grid sm:grid-cols-2 gap-6">
            {/* Parties */}
            <div className="col-span-full sm:col-span-1 space-y-4">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Parties
              </h2>
              <dl className="space-y-3">
                <DetailRow label="Landlord" value={agreement.landlordName} />
                <DetailRow label="Tenant" value={agreement.tenantName} />
              </dl>
            </div>

            {/* Financials */}
            <div className="space-y-4">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                Financials
              </h2>
              <dl className="space-y-3">
                <DetailRow
                  label="Monthly rent"
                  value={formatMoney(agreement.monthlyRent)}
                />
                <DetailRow
                  label="Advance payment"
                  value={formatMoney(agreement.advancePayment)}
                />
              </dl>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Timeline
              </h2>
              <dl className="space-y-3">
                <DetailRow
                  label="Start date"
                  value={formatDate(agreement.startDate)}
                />
                <DetailRow
                  label="End date"
                  value={formatDate(agreement.endDate)}
                />
                <DetailRow
                  label="Submitted"
                  value={formatDate(agreement.createdAt)}
                />
                {agreement.tenantSignedAt && (
                  <DetailRow
                    label="Tenant signed"
                    value={formatDate(agreement.tenantSignedAt)}
                  />
                )}
                {agreement.verifiedAt && (
                  <DetailRow
                    label="Verified"
                    value={formatDate(agreement.verifiedAt)}
                  />
                )}
              </dl>
            </div>

            {/* Utilities */}
            {agreement.utilities.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Utilities included
                </h2>
                <div className="flex flex-wrap gap-2">
                  {agreement.utilities.map((u) => (
                    <span
                      key={u}
                      className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 capitalize"
                    >
                      {u.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Termination reason */}
            {agreement.terminationReason && (
              <div className="col-span-full">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Termination / rejection reason
                </h2>
                <p className="text-sm text-slate-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                  {agreement.terminationReason}
                </p>
              </div>
            )}
          </div>

          {/* Review actions */}
          {isPendingVerification && (
            <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-4">
              <h2 className="text-sm font-semibold text-slate-700">
                Authority review
              </h2>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Rejection reason
                  <span className="text-slate-400 ml-1">(required if rejecting)</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Explain why the agreement is being rejected…"
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
                  onClick={() => review("active")}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  {busy ? "Processing…" : "Approve & Activate"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => review("rejected")}
                  className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  {busy ? "Processing…" : "Reject"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
