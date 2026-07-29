import { useAuth } from "@/context/AuthContext";
import { Navigate, Outlet } from "react-router-dom";

export function PrivateRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-slate-400">Loading...</span>
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
