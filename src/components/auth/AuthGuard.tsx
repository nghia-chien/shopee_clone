import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { token, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    // Nếu không có token → không hợp lệ
    if (!token) {
      setIsValid(false);
      setLoading(false);
      return;
    }

    // Kiểm tra token với backend
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(() => {
        setIsValid(true);
      })
      .catch(() => {
        logout(); // xóa token sai
        setIsValid(false);
      })
      .finally(() => setLoading(false));
  }, [token, logout]);

  if (loading) return <div>Loading...</div>;
  if (!isValid) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
