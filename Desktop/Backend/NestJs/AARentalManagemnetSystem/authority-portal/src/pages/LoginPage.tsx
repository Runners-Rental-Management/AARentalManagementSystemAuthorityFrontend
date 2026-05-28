import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { translateErrorMessage } from "@/lib/api-error";

export function LoginPage() {
  const { login, user, loading } = useAuth();
  const { t, locale } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const lastErrorRef = useRef<unknown>(null);

  useEffect(() => {
    if (lastErrorRef.current) {
      setError(translateErrorMessage(lastErrorRef.current, t));
    }
  }, [locale, t]);

  useEffect(() => {
    if (!loading && user) {
      navigate("/", { replace: true });
    }
  }, [loading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    lastErrorRef.current = null;
    if (!email.trim() || password.length < 8) {
      setError(t("authorityAuth", "credentialsRequired"));
      return;
    }
    setBusy(true);
    try {
      await login({ role: "admin", email: email.trim(), password });
      navigate("/", { replace: true });
    } catch (err) {
      lastErrorRef.current = err;
      setError(translateErrorMessage(err, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 flex">
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 relative overflow-hidden login-hero">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-lg bg-white/10 flex items-center justify-center border border-white/15">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-semibold tracking-tight">
              {t("authorityAuth", "portalTitle")}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4 tracking-tight leading-snug">
            {t("authorityAuth", "heroTitle")}
          </h1>
          <p className="text-stone-300 leading-relaxed max-w-md text-[15px]">
            {t("authorityAuth", "heroDesc")}
          </p>
        </div>
        <p className="relative z-10 text-xs text-stone-500">
          {t("authorityAuth", "footerNotice")}
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-surface-muted">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-surface-elevated rounded-xl border border-stone-200/80 shadow-md p-8"
        >
          <div className="flex items-center justify-end mb-4">
            <LanguageToggle />
          </div>

          <div className="flex items-center gap-2 text-primary-700 mb-6">
            <ShieldCheck className="w-5 h-5" />
            <span className="font-semibold">{t("authorityAuth", "officialSignIn")}</span>
          </div>

          <div className="mb-4 rounded-xl border border-primary-100 bg-primary-50 px-3 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">
              {t("authorityAuth", "role")}
            </p>
            <p className="text-sm font-medium text-stone-800">
              {t("authorityAuth", "locationAdmin")}
            </p>
          </div>

          <label className="block text-sm font-medium text-stone-700 mb-1">
            {t("authorityAuth", "officialEmail")}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-4 px-3 py-2.5 rounded-lg border border-stone-300 text-sm focus:border-primary-600 focus:ring-2 focus:ring-primary-600/15 outline-none transition-shadow"
            placeholder="name@agency.gov.et"
            autoComplete="username"
          />

          <label className="block text-sm font-medium text-stone-700 mb-1">
            {t("authorityAuth", "password")}
          </label>
          <div className="relative mb-4">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 pr-10 rounded-lg border border-stone-300 text-sm focus:border-primary-600 focus:ring-2 focus:ring-primary-600/15 outline-none transition-shadow"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400"
              aria-label={showPw ? t("common", "close") : t("authorityAuth", "password")}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <p className="text-xs text-stone-500 mb-4 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            {t("authorityAuth", "demoHint")}
          </p>

          {error && (
            <p className="text-sm text-rose-600 mb-4 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-lg bg-primary-700 hover:bg-primary-800 text-white font-semibold text-sm disabled:opacity-50 transition-colors"
          >
            {busy ? t("authorityAuth", "signingIn") : t("authorityAuth", "signIn")}
          </button>
        </form>
      </div>
    </div>
  );
}
