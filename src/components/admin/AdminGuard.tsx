import type { ReactNode } from "react";
import { useEffect } from "react";

import { useNavigate } from "react-router-dom";
import { useAdminAuthStore } from "../../store/AdminAuth";

interface AdminGuardProps {
  children: ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const navigate = useNavigate();
  const { token } = useAdminAuthStore();

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
    }
  }, [token, navigate]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}

