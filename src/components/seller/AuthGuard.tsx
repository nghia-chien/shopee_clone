// src/components/auth/SellerAuthGuard.tsx
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSellerAuthStore } from '../../store/SellerAuth'; // ✅ store riêng cho seller

interface AuthGuardProps {
  children: React.ReactNode;
}

export function SellerAuthGuard({ children }: AuthGuardProps) {
  const { token, logout } = useSellerAuthStore();
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (!token) {
      setIsValid(false);
      setLoading(false);
      return;
    }

    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000/api"}/seller/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Invalid token');
        return res.json();
      })
      .then(() => setIsValid(true))
      .catch(() => {
        logout();
        setIsValid(false);
      })
      .finally(() => setLoading(false));
  }, [token, logout]);

  if (loading) return <div>Loading...</div>;
  if (!isValid) return <Navigate to="/seller/login" replace />;

  return <>{children}</>;
}
