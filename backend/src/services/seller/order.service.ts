import { prisma } from '../../utils/prisma';

/**
 * 📊 Lấy thống kê đơn hàng đã bán
 */
export async function getSellerOrderStats(sellerId: string) {
  // Lấy tất cả products của seller
  const sellerProducts = await prisma.product.findMany({
    where: { sellerId },
    select: { id: true },
  });

  const productIds = sellerProducts.map((p) => p.id);

  // Lấy tất cả OrderItems có products của seller
  const orderItems = await prisma.orderItem.findMany({
    where: {
      productId: { in: productIds },
    },
    include: {
      orders: true,
      product: true,
    },
  });

  // Tính toán thống kê
  const stats = {
    totalOrders: new Set(orderItems.map((item) => item.orderId)).size,
    totalItemsSold: orderItems.reduce((sum, item) => sum + item.quantity, 0),
    totalRevenue: orderItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0),
    pendingOrders: new Set(
      orderItems.filter((item) => item.orders.status === 'pending').map((item) => item.orderId)
    ).size,
    completedOrders: new Set(
      orderItems.filter((item) => item.orders.status === 'completed').map((item) => item.orderId)
    ).size,
    cancelledOrders: new Set(
      orderItems.filter((item) => item.orders.status === 'cancelled').map((item) => item.orderId)
    ).size,
    recentOrders: orderItems
      .sort((a, b) => new Date(b.orders.createdAt).getTime() - new Date(a.orders.createdAt).getTime())
      .slice(0, 5)
      .map((item) => ({
        orderId: item.orderId,
        productName: item.product.title,
        quantity: item.quantity,
        price: Number(item.price),
        total: Number(item.price) * item.quantity,
        status: item.orders.status,
        createdAt: item.orders.createdAt,
      })),
  };

  return stats;
}

/**
 * 📈 Lấy analytics theo thời gian
 */
export async function getSellerAnalytics(sellerId: string, days: number = 30) {
  const sellerProducts = await prisma.product.findMany({
    where: { sellerId },
    select: { id: true },
  });

  const productIds = sellerProducts.map((p) => p.id);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const orderItems = await prisma.orderItem.findMany({
    where: {
      productId: { in: productIds },
      orders: {
        createdAt: {
          gte: startDate,
        },
      },
    },
    include: {
      orders: true,
      product: true,
    },
  });

  // Nhóm theo ngày
  const dailyStats: Record<string, { revenue: number; orders: number; items: number }> = {};

  orderItems.forEach((item) => {
    const date = new Date(item.orders.createdAt).toISOString().split('T')[0];
    if (!dailyStats[date]) {
      dailyStats[date] = { revenue: 0, orders: 0, items: 0 };
    }
    dailyStats[date].revenue += Number(item.price) * item.quantity;
    dailyStats[date].items += item.quantity;
  });

  // Đếm số orders unique mỗi ngày
  const orderDates: Record<string, Set<string>> = {};
  orderItems.forEach((item) => {
    const date = new Date(item.orders.createdAt).toISOString().split('T')[0];
    if (!orderDates[date]) {
      orderDates[date] = new Set();
    }
    orderDates[date].add(item.orderId);
  });

  Object.keys(orderDates).forEach((date) => {
    if (dailyStats[date]) {
      dailyStats[date].orders = orderDates[date].size;
    }
  });

  return {
    dailyStats: Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      ...stats,
    })),
    totalRevenue: Object.values(dailyStats).reduce((sum, s) => sum + s.revenue, 0),
    totalOrders: Object.values(orderDates).reduce((sum, set) => sum + set.size, 0),
    totalItems: Object.values(dailyStats).reduce((sum, s) => sum + s.items, 0),
  };
}

