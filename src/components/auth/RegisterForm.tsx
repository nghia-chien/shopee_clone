import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';

export function RegisterForm() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          phoneNumber,
          password,
          name: name || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setAuth(data.token, data.user);
      navigate('/');
    } catch (error) {
      console.error('Registration failed:', error);
      alert(error instanceof Error ? error.message : 'Đăng ký thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Đăng ký</h1>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Input */}
        <div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Họ và tên (tùy chọn)"
            className="text-black w-full px-4 py-3 bg-white border border-black focus:ring-2 focus:ring-black focus:border-black outline-none"
          />
        </div>

        {/* Email Input */}
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="text-black w-full px-4 py-3 bg-white border border-black focus:ring-2 focus:ring-black focus:border-black outline-none"
            required
          />
        </div>

        {/* Phone Number Input */}
        <div>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Số điện thoại"
            className="text-black w-full px-4 py-3 bg-white border border-black focus:ring-2 focus:ring-black focus:border-black outline-none"
            required
          />
        </div>

        {/* Password Input */}
        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mật khẩu (tối thiểu 6 ký tự)"
            className="text-black w-full px-4 py-3 bg-white border border-black focus:ring-2 focus:ring-black focus:border-black outline-none"
            required
            minLength={6}
          />
        </div>

        {/* Register Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-orange-500 text-white py-3 font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Đang đăng ký...' : 'ĐĂNG KÝ'}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center my-6">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="px-4 text-gray-500 text-sm">HOẶC</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>

      {/* Social Login */}
      <div className="flex space-x-3">
      <button className="flex-1 flex items-center justify-center space-x-3 bg-white text-blue-600 py-3 rounded-sm border border-gray-400 hover:bg-gray-100 hover:border-gray-500 focus:outline-none focus:ring-0 transition-colors">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        <span>Facebook</span>
      </button>

      <button className="flex-1 flex items-center justify-center space-x-3 bg-white text-gray-700 py-3 rounded-sm border border-gray-400 hover:bg-gray-100 hover:border-gray-500 focus:outline-none focus:ring-0 transition-colors">
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span>Google</span>
      </button>
      </div>


      {/* Terms and Conditions */}
      <div className="mt-6 text-xs text-gray-600 text-center">
        <span>Bằng việc đăng kí, bạn đã đồng ý với Shopee về </span>
        <Link to="/terms" className="text-orange-500 hover:text-orange-600">
          Điều khoản dịch vụ
        </Link>
        <span> & </span>
        <Link to="/privacy" className="text-orange-500 hover:text-orange-600">
          Chính sách bảo mật
        </Link>
      </div>

      {/* Login Link */}
      <div className="mt-6 text-center text-sm">
        <span className="text-gray-600">Bạn đã có tài khoản? </span>
        <Link to="/login" className="text-orange-500 hover:text-orange-600 font-medium">
          Đăng nhập
        </Link>
      </div>
    </div>
  );
}

