import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from '../screens/HomePage';
import { ProductPage } from '../screens/ProductPage';
import { LoginPage } from '../screens/LoginPage';
import { RegisterPage } from '../screens/RegisterPage';
import { TestPage } from '../screens/TestPage';
import { SimpleLoginPage } from '../screens/SimpleLoginPage';
import { AdminApp } from '../admin/AdminApp';
import { AuthGuard } from '../components/auth/AuthGuard';

export function AppRoutes() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/test" element={<TestPage />} /> 
				<Route path="/simple-login" element={<SimpleLoginPage />} />
				<Route path="/login" element={<LoginPage />} />
				<Route path="/register" element={<RegisterPage />} />
				<Route path="/" element={
					<AuthGuard>
						<HomePage />
					</AuthGuard>
				} />
				<Route path="/products/:id" element={
					<AuthGuard>
						<ProductPage />
					</AuthGuard>
				} />
				<Route path="/admin/*" element={<AdminApp />} />
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</BrowserRouter>
	);
}
