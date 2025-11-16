import { prisma } from '../utils/prisma';

export type SenderType = 'USER' | 'SELLER' | 'SYSTEM';

/**
 * Tạo thread mới hoặc trả về thread đã tồn tại giữa user và seller
 */
export async function createThreadIfNotExist(userId: string, sellerId: string) {
  // Kiểm tra thread đã tồn tại chưa
  const existingThread = await prisma.chat_threads.findFirst({
    where: {
      user_id: userId,
      seller_id: sellerId,
    },
  });

  if (existingThread) {
    return existingThread;
  }

  // Tạo thread mới
  return prisma.chat_threads.create({
    data: {
      user_id: userId,
      seller_id: sellerId,
    },
  });
}

/**
 * Gửi tin nhắn bình thường (USER hoặc SELLER)
 */
export async function sendMessage(
  threadId: string,
  senderType: 'USER' | 'SELLER' | 'SYSTEM',
  userId: string | null,
  sellerId: string | null,
  content: string,
  attachments?: any
) {
  // Validation: SYSTEM messages không được gửi qua hàm này
  if (senderType === 'SYSTEM') {
    throw new Error('Use sendSystemMessage for SYSTEM messages');
  }

  // Validation: USER phải có userId, SELLER phải có sellerId
  if (senderType === 'USER' && !userId) {
    throw new Error('userId is required for USER messages');
  }
  if (senderType === 'SELLER' && !sellerId) {
    throw new Error('sellerId is required for SELLER messages');
  }

  // Kiểm tra thread tồn tại
  const thread = await prisma.chat_threads.findUnique({
    where: { id: threadId },
  });

  if (!thread) {
    throw new Error('Thread not found');
  }

  // Tạo message
  const message = await prisma.messages.create({
    data: {
      thread_id: threadId,
      user_id: senderType === 'USER' ? userId : null,
      seller_id: senderType === 'SELLER' ? sellerId : null,
      sender_type: senderType,
      content,
      attachments,
    },
    include: {
      user: senderType === 'USER' ? true : false,
      seller: senderType === 'SELLER' ? true : false,
    },
  });

  // Cập nhật updated_at của thread
  await prisma.chat_threads.update({
    where: { id: threadId },
    data: { updated_at: new Date() },
  });

  return message;
}

/**
 * Gửi tin nhắn hệ thống về đơn hàng
 */
export async function sendSystemMessage(
  threadId: string,
  orderId: string,
  status: string
) {
  // Lấy thông tin seller_order và order
  const sellerOrder = await prisma.seller_order.findFirst({
    where: {
      order_id: orderId,
    },
    include: {
      orders: {
        include: {
          order_item: {
            include: {
              product: true,
            },
          },
          user: true,
        },
      },
      seller: true,
    },
  });

  if (!sellerOrder) {
    throw new Error('Seller order not found');
  }

  // Lấy thread để lấy user_id và seller_id
  const thread = await prisma.chat_threads.findUnique({
    where: { id: threadId },
  });

  if (!thread) {
    throw new Error('Thread not found');
  }

  // Build message content
  const orderItems = sellerOrder.orders.order_item;
  const firstProduct = orderItems[0]?.product;
  const orderName = orderItems.length === 1
    ? firstProduct?.title || 'Đơn hàng'
    : `${firstProduct?.title || 'Sản phẩm'} và ${orderItems.length - 1} sản phẩm khác`;

  const price = sellerOrder.total;
  const image = firstProduct?.images?.[0] || null;

  // Map status to Vietnamese
  const statusMap: Record<string, string> = {
    'pending': 'Đang chờ xử lý',
    'accepted': 'Đang xử lý',
    'completed': 'Hoàn thành',
    'cancelled': 'Đã hủy',
  };
  const statusText = statusMap[status] || status;

  // Build content as JSON for structured data
  const messageContent = JSON.stringify({
    type: 'order_update',
    orderId,
    orderName,
    price: price.toString(),
    image,
    status: statusText,
    statusCode: status,
  });

  // Tạo system message
  const message = await prisma.messages.create({
    data: {
      thread_id: threadId,
      sender_type: 'SYSTEM',
      content: messageContent,
      order_id: orderId,
      // SYSTEM messages không có user_id hoặc seller_id
      user_id: null,
      seller_id: null,
    },
  });

  // Cập nhật updated_at của thread
  await prisma.chat_threads.update({
    where: { id: threadId },
    data: { updated_at: new Date() },
  });

  return message;
}

/**
 * Cập nhật trạng thái trong tin nhắn hệ thống của đơn hàng
 */
export async function updateOrderMessageStatus(orderId: string, newStatus: string) {
  // Tìm tất cả system messages liên quan đến order này
  const messages = await prisma.messages.findMany({
    where: {
      order_id: orderId,
      sender_type: 'SYSTEM',
    },
  });

  if (messages.length === 0) {
    return null;
  }

  // Map status to Vietnamese
  const statusMap: Record<string, string> = {
    'pending': 'Đang chờ xử lý',
    'accepted': 'Đang xử lý',
    'completed': 'Hoàn thành',
    'cancelled': 'Đã hủy',
  };
  const statusText = statusMap[newStatus] || newStatus;

  // Cập nhật message mới nhất (hoặc tất cả)
  const latestMessage = messages[messages.length - 1];
  if (latestMessage && latestMessage.content) {
    try {
      const contentData = JSON.parse(latestMessage.content);
      contentData.status = statusText;
      contentData.statusCode = newStatus;

      return prisma.messages.update({
        where: { id: latestMessage.id },
        data: {
          content: JSON.stringify(contentData),
        },
      });
    } catch (error) {
      console.error('Error parsing message content:', error);
    }
  }

  return null;
}

