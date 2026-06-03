import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Loader2, MapPin, Phone, User } from "lucide-react";
import { apiGetAgreementContacts, getAccessToken } from "@/lib/api";
import type { AgreementContacts, AgreementPartyContact } from "@/lib/types";

type Props = {
  agreementId: string;
  contacts?: AgreementContacts;
  contactsAvailable?: boolean;
};

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [value]);

  return (
    <button
      type="button"
      onClick={() => void copy()}
      disabled={!value}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-800 disabled:opacity-40 transition-colors"
      aria-label={`Copy ${label}`}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-emerald-600">Copied</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5 min-w-0">
      <Icon className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-stone-400 font-medium">
          {label}
        </p>
        <p className="text-sm text-stone-800 break-words">{value || "—"}</p>
      </div>
      <CopyButton value={value} label={label} />
    </div>
  );
}

function PartyCard({
  party,
  role,
  title,
  avatarClass,
  iconClass,
}: {
  party: AgreementPartyContact;
  role: "landlord" | "tenant";
  title: string;
  avatarClass: string;
  iconClass: string;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-5 flex flex-col gap-4">
      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
        {title}
      </p>
      <div className="flex items-center gap-3">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${avatarClass}`}
        >
          <User className={`w-6 h-6 ${iconClass}`} />
        </div>
        <div className="min-w-0">
          <p className="text-base font-semibold text-stone-900 truncate">
            {party.fullName}
          </p>
          <span
            className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
              role === "landlord"
                ? "bg-blue-100 text-blue-700"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {role === "landlord" ? "Landlord" : "Tenant"}
          </span>
        </div>
      </div>
      <div className="space-y-3 pt-1 border-t border-stone-200/80">
        <ContactRow icon={User} label="Full name" value={party.fullName} />
        <ContactRow icon={Phone} label="Phone number" value={party.phone} />
        <ContactRow icon={MapPin} label="Address" value={party.address} />
      </div>
    </div>
  );
}

/** Authority officials always receive party contact details for review. */
export function AgreementContactSection({
  agreementId,
  contacts: initialContacts,
  contactsAvailable: initialAvailable,
}: Props) {
  const [contacts, setContacts] = useState<AgreementContacts | undefined>(
    initialAvailable && initialContacts ? initialContacts : undefined,
  );
  const [loading, setLoading] = useState(!initialContacts);

  useEffect(() => {
    if (initialContacts) {
      setContacts(initialContacts);
      setLoading(false);
      return;
    }
    const token = getAccessToken();
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    void apiGetAgreementContacts(token, agreementId)
      .then((res) => {
        if (!cancelled && res.contactsAvailable && res.contacts) {
          setContacts(res.contacts);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [agreementId, initialContacts]);

  return (
    <div className="col-span-full bg-white rounded-xl border border-stone-200 p-6">
      <h2 className="text-sm font-semibold text-stone-900 mb-4">
        Contact information
      </h2>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-stone-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading contact information…
        </div>
      ) : !contacts ? (
        <p className="text-sm text-stone-500 py-6 text-center">
          Contact details are not available for this agreement.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <PartyCard
            party={contacts.landlord}
            role="landlord"
            title="Landlord information"
            avatarClass="bg-blue-100"
            iconClass="text-blue-600"
          />
          <PartyCard
            party={contacts.tenant}
            role="tenant"
            title="Tenant information"
            avatarClass="bg-emerald-100"
            iconClass="text-emerald-600"
          />
        </div>
      )}
    </div>
  );
}
