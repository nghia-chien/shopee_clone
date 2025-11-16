import { prisma } from '../utils/prisma';

/**
 * Kiểm tra user có thể review sản phẩm không
 * - User phải có seller_order với status = 'completed'
 * - seller_order chưa có review
 */
export async function canReviewProduct(
  userId: string,
  sellerOrderId: string,
  productId: string
): Promise<{ canReview: boolean; message?: string; sellerOrder?: any }> {

  // Lấy order của user, bao gồm items
  const sellerOrder = await prisma.seller_order.findFirst({
    where: {
      id: sellerOrderId,
      orders: { user_id: userId },
    },
    include: {
      orders: {
        include: {
          order_item: true, // lấy tất cả items
        },
      },
    },
  });

  if (!sellerOrder) {
    return { canReview: false, message: 'Seller order not found or not owned by user' };
  }

  // Kiểm tra productId có trong order_item không
  const productInOrder = sellerOrder.orders.order_item.find(item => item.product_id === productId);
  if (!productInOrder) {
    return { canReview: false, message: 'Product not found in this order' };
  }

  // Kiểm tra order status
  if (sellerOrder.seller_status !== 'completed') {
    return { canReview: false, message: 'Order must be completed before reviewing' };
  }

  // Kiểm tra đã review chưa
  const existingReview = await prisma.product_reviews.findFirst({
    where: { seller_order_id: sellerOrderId, product_id: productId },
  });
  if (existingReview) {
    return { canReview: false, message: 'You have already reviewed this product in this order' };
  }

  return { canReview: true, sellerOrder };
}


/**
 * Kiểm tra user có thể like review không
 * - User phải đã mua sản phẩm (có seller_order.completed với product đó)
 */
// export async function canLikeReview(userId: string, reviewId: string): Promise<{ canLike: boolean; message?: string }> {
//   // Lấy review và product
//   const review = await prisma.product_reviews.findUnique({
//     where: { id: reviewId },
//     include: {
//       product: {
//         select: {
//           id: true,
//         },
//       },
//     },
//   });

//   if (!review) {
//     return { canLike: false, message: 'Review not found' };
//   }

//   // Kiểm tra user đã mua sản phẩm này (có seller_order.completed)
//   const hasPurchased = await prisma.seller_order.findFirst({
//     where: {
//       orders: {
//         user_id: userId,
//         order_item: {
//           some: {
//             product_id: review.product_id,
//           },
//         },
//       },
//       seller_status: 'completed',
//     },
//   });

//   if (!hasPurchased) {
//     return { canLike: false, message: 'You must purchase this product before liking reviews' };
//   }

//   return { canLike: true };
// }

/**
 * Kiểm tra seller có thể reply review không
 * - Seller phải là owner của product trong review
 */
export async function isProductOwner(sellerId: string, reviewId: string): Promise<{ isOwner: boolean; message?: string }> {
  const review = await prisma.product_reviews.findUnique({
    where: { id: reviewId },
    include: {
      product: {
        select: {
          seller_id: true,
        },
      },
    },
  });

  if (!review) {
    return { isOwner: false, message: 'Review not found' };
  }

  if (review.product.seller_id !== sellerId) {
    return { isOwner: false, message: 'You can only reply to reviews of your products' };
  }

  return { isOwner: true };
}

/**
 * Tính toán và cập nhật rating trung bình của sản phẩm
 */
export async function calculateProductRating(productId: string): Promise<void> {
  const reviews = await prisma.product_reviews.findMany({
    where: { product_id: productId },
    select: { rating: true },
  });

  if (reviews.length === 0) {
    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: 0,
        reviews_count: 0,
      },
    });
    return;
  }

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: avgRating,
      reviews_count: reviews.length,
    },
  });
}

/**
 * Validate media files (max 5 files)
 */
export function validateMediaFiles(mediaFiles: any[]): { valid: boolean; message?: string } {
  if (mediaFiles.length > 5) {
    return { valid: false, message: 'Maximum 5 media files allowed per review' };
  }

  // Validate file types (image or video)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
  for (const file of mediaFiles) {
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, message: `Invalid file type: ${file.type}. Allowed types: ${allowedTypes.join(', ')}` };
    }
  }

  return { valid: true };
}

