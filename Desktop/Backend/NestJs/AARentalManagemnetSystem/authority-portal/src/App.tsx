import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { ToastProvider } from "@/components/Toast";
import { AppLayout } from "@/components/AppLayout";
import { LoginPage } from "@/pages/LoginPage";

const DashboardPage = lazy(() =>
  import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const AgreementsPage = lazy(() =>
  import("@/pages/AgreementsPage").then((m) => ({ default: m.AgreementsPage })),
);
const AgreementDetailPage = lazy(() =>
  import("@/pages/AgreementDetailPage").then((m) => ({
    default: m.AgreementDetailPage,
  })),
);
const RentAdjustmentsPage = lazy(() =>
  import("@/pages/RentAdjustmentsPage").then((m) => ({
    default: m.RentAdjustmentsPage,
  })),
);
const PropertiesPage = lazy(() =>
  import("@/pages/PropertiesPage").then((m) => ({ default: m.PropertiesPage })),
);
const PropertyDetailPage = lazy(() =>
  import("@/pages/PropertyDetailPage").then((m) => ({
    default: m.PropertyDetailPage,
  })),
);
const UsersPage = lazy(() =>
  import("@/pages/UsersPage").then((m) => ({ default: m.UsersPage })),
);
const UserDetailPage = lazy(() =>
  import("@/pages/UserDetailPage").then((m) => ({ default: m.UserDetailPage })),
);
const SystemParametersPage = lazy(() =>
  import("@/pages/SystemParametersPage").then((m) => ({
    default: m.SystemParametersPage,
  })),
);
const AuditLogsPage = lazy(() =>
  import("@/pages/AuditLogsPage").then((m) => ({ default: m.AuditLogsPage })),
);
const ProfilePage = lazy(() =>
  import("@/pages/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);
const NotificationsPage = lazy(() =>
  import("@/pages/NotificationsPage").then((m) => ({ default: m.NotificationsPage })),
);

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-16 text-stone-500">
      <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-stone-500 bg-stone-50">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">{t("common", "loading")}</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <Protected>
              <AppLayout />
            </Protected>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="agreements" element={<AgreementsPage />} />
          <Route path="agreements/:id" element={<AgreementDetailPage />} />
          <Route path="properties" element={<PropertiesPage />} />
          <Route path="properties/:id" element={<PropertyDetailPage />} />
          <Route path="rent-adjustments" element={<RentAdjustmentsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="users/:id" element={<UserDetailPage />} />
          <Route path="parameters" element={<SystemParametersPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </LanguageProvider>
  );
}
