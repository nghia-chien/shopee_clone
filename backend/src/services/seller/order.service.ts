import { prisma } from '../../utils/prisma';

/**
 * 📊 Lấy thống kê đơn hàng đã bán
 */
export async function getSellerOrderStats(seller_id: string) {
  // Lấy tất cả products của seller
  const sellerProducts = await prisma.product.findMany({
    where: { seller_id },
    select: { id: true },
  });

  const product_ids = sellerProducts.map((p) => p.id);

  // Lấy tất cả OrderItems có products của seller
  const orderItems = await prisma.orderItem.findMany({
    where: {
      product_id: { in: product_ids },
    },
    include: {
      orders: true,
      product: true,
    },
  });

  // Tính toán thống kê
  const stats = {
    totalOrders: new Set(orderItems.map((item) => item.order_id)).size,
    totalItemsSold: orderItems.reduce((sum, item) => sum + item.quantity, 0),
    totalRevenue: orderItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0),
    pendingOrders: new Set(
      orderItems.filter((item) => item.orders.status === 'pending').map((item) => item.order_id)
    ).size,
    completedOrders: new Set(
      orderItems.filter((item) => item.orders.status === 'completed').map((item) => item.order_id)
    ).size,
    cancelledOrders: new Set(
      orderItems.filter((item) => item.orders.status === 'cancelled').map((item) => item.order_id)
    ).size,
    recentOrders: orderItems
      .sort((a, b) => new Date(b.orders.creat_at).getTime() - new Date(a.orders.creat_at).getTime())
      .slice(0, 5)
      .map((item) => ({
        order_id: item.order_id,
        productName: item.product.title,
        quantity: item.quantity,
        price: Number(item.price),
        total: Number(item.price) * item.quantity,
        status: item.orders.status,
        creat_at: item.orders.creat_at,
      })),
  };

  return stats;
}

/**
 * 📈 Lấy analytics theo thời gian
 */
export async function getSellerAnalytics(seller_id: string, days: number = 30) {
  const sellerProducts = await prisma.product.findMany({
    where: { seller_id },
    select: { id: true },
  });

  const product_ids = sellerProducts.map((p) => p.id);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const orderItems = await prisma.orderItem.findMany({
    where: {
      product_id: { in: product_ids },
      orders: {
        creat_at: {
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
    const date = new Date(item.orders.creat_at).toISOString().split('T')[0];
    if (!dailyStats[date]) {
      dailyStats[date] = { revenue: 0, orders: 0, items: 0 };
    }
    dailyStats[date].revenue += Number(item.price) * item.quantity;
    dailyStats[date].items += item.quantity;
  });

  // Đếm số orders unique mỗi ngày
  const orderDates: Record<string, Set<string>> = {};
  orderItems.forEach((item) => {
    const date = new Date(item.orders.creat_at).toISOString().split('T')[0];
    if (!orderDates[date]) {
      orderDates[date] = new Set();
    }
    orderDates[date].add(item.order_id);
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

