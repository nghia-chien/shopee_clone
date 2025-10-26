export function SimpleLoginPage() {
  return (
    <div className="min-h-screen bg-red-600 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Đăng nhập</h1>
        <form className="space-y-4">
          <input
            type="email"
            placeholder="Email/Số điện thoại"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
          />
          <button
            type="submit"
            className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
          >
            ĐĂNG NHẬP
          </button>
        </form>
      </div>
    </div>
  );
}
