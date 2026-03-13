import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading, orgInfo } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Chargement…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If no org and not already on onboarding/setup pages, redirect
  const setupPaths = ["/onboarding", "/setup-organization"];
  if (!orgInfo && !setupPaths.includes(location.pathname)) {
    return <Navigate to="/setup-organization" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
