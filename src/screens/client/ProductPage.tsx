import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { useState } from 'react';

export function ProductPage() {
	const params = useParams();
	const { data } = useQuery({
		queryKey: ['product', params.id],
		queryFn: () => api<any>(`/products/${params.id}`),
		enabled: Boolean(params.id),
	});

	const [quantity, setQuantity] = useState(1);

	if (!data) return <div className="p-4">Đang tải...</div>;

	return (
		<div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
			{/* Ảnh sản phẩm */}
			<div className="flex flex-col items-center space-y-4">
				{data.images?.length ? (
					<div className="grid grid-cols-2 gap-4">
						{data.images.map((img: string, i: number) => (
							<img
								key={i}
								src={img}
								alt={data.name}
								className="rounded-lg border w-full h-48 object-cover"
							/>
						))}
					</div>
				) : (
					<img
						src="https://placehold.co/400x400"
						alt="no image"
						className="rounded-lg border w-full max-w-sm object-cover"
					/>
				)}
			</div>

			{/* Thông tin sản phẩm */}
			<div className="space-y-4">
				<h1 className="text-2xl font-bold">{data.title}</h1>
				<p className="text-gray-700">{data.description || 'Không có mô tả'}</p>
				<p className="text-lg font-semibold text-green-600">
					Giá: {data.price?.toLocaleString()} ₫
				</p>
				<p>Số lượng còn lại: {data.stock}</p>
				<p>Người bán: {data.sellerId?.name || 'Không rõ'}</p>

				{/* Chọn số lượng */}
				<div className="flex items-center space-x-2">
					<button
						onClick={() => setQuantity(q => Math.max(1, q - 1))}
						className="px-3 py-1 border rounded"
					>
						-
					</button>
					<span>{quantity}</span>
					<button
						onClick={() => setQuantity(q => q + 1)}
						className="px-3 py-1 border rounded"
					>
						+
					</button>
				</div>

				{/* Nút hành động */}
				<div className="flex space-x-4">
					<button
						onClick={() => alert('Đã thêm vào giỏ hàng')}
						className="px-4 py-2 bg-yellow-400 rounded text-black font-semibold"
					>
						Thêm vào giỏ
					</button>
					<button
						onClick={() => alert('Mua ngay')}
						className="px-4 py-2 bg-green-600 rounded text-white font-semibold"
					>
						Mua ngay
					</button>
				</div>
			</div>
		</div>
	);
}
