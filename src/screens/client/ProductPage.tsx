import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';

export function ProductPage() {
	const params = useParams();
	const { data } = useQuery({
		queryKey: ['product', params.id],
		queryFn: () => api<{ id: string }>(`/products/${params.id}`),
		enabled: Boolean(params.id),
	});
	return (
		<div className="p-4">
			<h1 className="text-xl font-bold">Product {data?.id}</h1>
		</div>
	);
}
