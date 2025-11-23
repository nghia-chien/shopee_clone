import { useList, useShow, useDelete } from "@refinedev/core";
import { useNavigate, useParams } from "react-router-dom";
import { Trash2, Eye, Search } from "lucide-react";
import { useState } from "react";

export function ReviewList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: listData, isLoading } = useList({
    resource: "reviews",
    pagination: {
      current: 1,
      pageSize: 20,
    },
    filters: search ? [{ field: "q", operator: "contains", value: search }] : [],
  });

  const { mutate: deleteReview } = useDelete();

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) {
      deleteReview({
        resource: "reviews",
        id,
      });
    }
  };

  // In Refine v4, listData has structure: { data: [...], total: number }
  const reviews = listData?.data || [];
  const total = listData?.total || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản Lý Đánh Giá</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm kiếm đánh giá..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người đánh giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đánh giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao Tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reviews.map((review: any) => (
                  <tr key={review.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {review.product?.title || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{review.user?.name || "N/A"}</div>
                      <div className="text-sm text-gray-500">{review.user?.email || ""}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">{"★".repeat(review.rating)}</span>
                        <span className="text-gray-400">{"★".repeat(5 - review.rating)}</span>
                        <span className="ml-2 text-sm text-gray-600">({review.rating})</span>
                      </div>
                      {review.title && (
                        <div className="text-sm text-gray-700 mt-1">{review.title}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/reviews/show/${review.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(review.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-sm text-gray-500">Tổng: {total} đánh giá</div>
        </>
      )}
    </div>
  );
}

export function ReviewShow() {
  const { id } = useParams();
  const navigate = useNavigate();

  const showResult = useShow({
    resource: "reviews",
    id: id!,
  });

  // In Refine v4, useShow returns QueryObserverResult with data: { data: TData }
  const review = (showResult as any).data?.data;
  const isLoading = (showResult as any).isLoading || (showResult as any).isFetching || false;

  if (isLoading) return <div>Đang tải...</div>;
  if (!review) return <div>Không tìm thấy đánh giá</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chi Tiết Đánh Giá</h1>
        <button
          onClick={() => navigate("/admin/reviews")}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Quay lại
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Thông Tin Đánh Giá</h2>
          <div className="space-y-2">
            <p><strong>Đánh giá:</strong> {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
            {review.title && <p><strong>Tiêu đề:</strong> {review.title}</p>}
            {review.content && <p><strong>Nội dung:</strong> {review.content}</p>}
            <p><strong>Ngày tạo:</strong> {new Date(review.created_at).toLocaleString("vi-VN")}</p>
          </div>
        </div>

        {review.product && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Sản Phẩm</h2>
            <p><strong>Tên:</strong> {review.product.title}</p>
          </div>
        )}

        {review.user && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Người Đánh Giá</h2>
            <p><strong>Tên:</strong> {review.user.name || "N/A"}</p>
            <p><strong>Email:</strong> {review.user.email || "N/A"}</p>
          </div>
        )}

        {review.review_replies && review.review_replies.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Phản Hồi</h2>
            {review.review_replies.map((reply: any) => (
              <div key={reply.id} className="border-l-4 border-blue-500 pl-4 mb-2">
                <p><strong>{reply.seller?.name}:</strong> {reply.content}</p>
                <p className="text-sm text-gray-500">
                  {new Date(reply.created_at).toLocaleString("vi-VN")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

