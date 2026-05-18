import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  FileText,
  User,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { apiGetDispute, apiReviewDispute, getAccessToken } from "@/lib/api";
import { getErrorMessage } from "@/lib/api-error";
import { useToast } from "@/components/Toast";
import type { Dispute, DisputeStatus, PriorityLevel } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const VIOLATION_LABELS: Record<string, string> = {
  illegal_rent_increase: "Illegal rent increase",
  wrongful_eviction: "Wrongful eviction",
  maintenance_neglect: "Maintenance neglect",
  deposit_withholding: "Deposit withholding",
  harassment: "Harassment",
  lease_violation: "Lease violation",
  other: "Other",
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}

export function DisputeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [newStatus, setNewStatus] = useState<DisputeStatus>("under_review");
  const [newPriority, setNewPriority] = useState<PriorityLevel>("medium");
  const [resolution, setResolution] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token || !id) return;
    void apiGetDispute(token, id)
      .then((d) => {
        setDispute(d);
        setNewStatus(d.status);
        setNewPriority(d.priority);
        setResolution(d.resolution ?? "");
      })
      .catch((e) => setLoadError(getErrorMessage(e)));
  }, [id]);

  const isFinalized =
    dispute?.status === "resolved" || dispute?.status === "closed";

  const submit = async () => {
    const token = getAccessToken();
    if (!token || !id) return;
    if (
      (newStatus === "resolved" || newStatus === "closed") &&
      !resolution.trim()
    ) {
      setError("Resolution notes are required when resolving or closing a dispute.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiReviewDispute(token, id, {
        status: newStatus,
        priority: newPriority,
        resolution: resolution.trim() || undefined,
      });
      toast.success("Dispute updated successfully.");
      navigate("/disputes");
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (!dispute && !loadError) {
    return (
      <div className="max-w-3xl">
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 animate-pulse">
          <div className="h-6 bg-slate-100 rounded w-1/2" />
          <div className="h-4 bg-slate-100 rounded w-3/4" />
          <div className="h-20 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <Link
        to="/disputes"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to disputes
      </Link>

      {loadError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700">
          {loadError}
        </div>
      )}

      {dispute && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-start justify-between gap-4 mb-3">
              <h1 className="text-xl font-bold text-slate-900">{dispute.title}</h1>
              <div className="flex gap-2 shrink-0">
                <StatusBadge value={dispute.priority} />
                <StatusBadge value={dispute.status} />
              </div>
            </div>
            {dispute.propertyTitle && (
              <p className="text-sm text-slate-500">{dispute.propertyTitle}</p>
            )}
          </div>

          {/* Description */}
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Description
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">{dispute.description}</p>
          </div>

          {/* Details */}
          <div className="p-6 grid sm:grid-cols-2 gap-6 border-b border-slate-100">
            <div className="space-y-4">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Parties
              </h2>
              <dl className="space-y-3">
                <DetailRow label="Reporter" value={dispute.reporterName} />
                <DetailRow label="Respondent" value={dispute.respondentName} />
                {dispute.assignedTo && (
                  <DetailRow label="Assigned to" value={dispute.assignedTo} />
                )}
              </dl>
            </div>

            <div className="space-y-4">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Case details
              </h2>
              <dl className="space-y-3">
                <DetailRow
                  label="Violation type"
                  value={VIOLATION_LABELS[dispute.violationType] ?? dispute.violationType.replace(/_/g, " ")}
                />
                <DetailRow label="Filed" value={formatDate(dispute.createdAt)} />
                {dispute.resolvedAt && (
                  <DetailRow
                    label="Resolved"
                    value={formatDate(dispute.resolvedAt)}
                  />
                )}
              </dl>
            </div>

            {dispute.resolution && (
              <div className="col-span-full space-y-2">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Resolution
                </h2>
                <p className="text-sm text-slate-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 leading-relaxed">
                  {dispute.resolution}
                </p>
              </div>
            )}
          </div>

          {/* Review actions — hidden if already finalized */}
          {!isFinalized && (
            <div className="p-6 bg-slate-50 space-y-4">
              <h2 className="text-sm font-semibold text-slate-700">Update dispute</h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as DisputeStatus)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                  >
                    <option value="under_review">Under review</option>
                    <option value="mediation">Mediation</option>
                    <option value="escalated">Escalated</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as PriorityLevel)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Resolution notes
                  {(newStatus === "resolved" || newStatus === "closed") && (
                    <span className="text-rose-500 ml-1">*required</span>
                  )}
                </label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Describe the outcome, mediation result, or next steps…"
                />
              </div>

              {error && (
                <div className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <button
                type="button"
                disabled={busy}
                onClick={submit}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {busy ? "Saving…" : "Save review"}
              </button>
            </div>
          )}

          {isFinalized && (
            <div className="p-6 bg-emerald-50 border-t border-emerald-100">
              <p className="text-sm text-emerald-700 font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                This dispute has been finalized and can no longer be updated.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
