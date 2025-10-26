import { Refine } from '@refinedev/core';
import { BrowserRouter } from 'react-router-dom';
import routerBindings from '@refinedev/react-router';
import dataProvider from '@refinedev/simple-rest';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export function AdminApp() {
	return (
		<BrowserRouter>
			<Refine
				dataProvider={dataProvider(API_URL)}
				routerProvider={routerBindings}
				resources={[
					{ name: 'products', list: '/', show: '/products/:id' },
					{ name: 'orders', list: '/orders' },
					{ name: 'users', list: '/users' },
				]}
			/>
		</BrowserRouter>
	);
}
