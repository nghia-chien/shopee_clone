import { Link } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { LoginForm } from '../../components/auth/LoginForm';

export function LoginPage() {
  return (
    <AuthLayout title="Đăng nhập">
      <LoginForm />
    </AuthLayout>
  );
}
