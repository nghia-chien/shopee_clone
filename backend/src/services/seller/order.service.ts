import { prisma } from '../../utils/prisma';

/**
 * 📊 Thống kê đơn hàng của seller dựa trên seller_order
 */
export async function getSellerOrderStats(seller_id: string) {
  // Lấy tất cả products của seller
  const product_ids = (await prisma.product.findMany({
    where: { seller_id },
    select: { id: true },
  })).map(p => p.id);

  // Lấy tất cả order_items của seller, include orders và seller_order
  const order_items = await prisma.order_item.findMany({
    where: { product_id: { in: product_ids } },
    include: {
      product: true,
      orders: {
        include: {
          seller_order: {
            where: { seller_id },
          },
        },
      },
    },
  });

  const totalOrdersSet = new Set<string>();
  const pendingOrdersSet = new Set<string>();
  const acceptedOrdersSet = new Set<string>();
  const cancelledOrdersSet = new Set<string>();
  const completedOrdersSet = new Set<string>();

  let totalItemsSold = 0;
  let totalRevenue = 0;

  const recentOrdersMap = new Map<string, any>();

  order_items.forEach(item => {
    const { order_id, quantity, price, product, orders } = item;

    // Tính số lượng, doanh thu
    totalItemsSold += quantity;
    totalRevenue += Number(price) * quantity;

    // Lấy seller_order cho seller hiện tại
    const sellerOrder = orders.seller_order[0]; // giả sử mỗi seller chỉ có 1 seller_order / order
    if (!sellerOrder) return;

    totalOrdersSet.add(sellerOrder.id);

    // Thống kê trạng thái
    switch (sellerOrder.seller_status) {
      case 'pending':
        pendingOrdersSet.add(sellerOrder.id);
        break;
      case 'accepted':
        acceptedOrdersSet.add(sellerOrder.id);
        break;
      case 'cancelled':
        cancelledOrdersSet.add(sellerOrder.id);
        break;
      case 'completed':
        completedOrdersSet.add(sellerOrder.id);
        break;
    }

    // Recent orders
    if (!recentOrdersMap.has(sellerOrder.id)) {
      recentOrdersMap.set(sellerOrder.id, {
        order_id: sellerOrder.id,
        productName: product.title,
        quantity,
        price: Number(price),
        total: Number(price) * quantity,
        status: sellerOrder.seller_status,
        created_at: sellerOrder.created_at,
      });
    }
  });

  const recentOrders = Array.from(recentOrdersMap.values())
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return {
    totalOrders: totalOrdersSet.size,
    totalItemsSold,
    totalRevenue,
    pendingOrders: pendingOrdersSet.size,
    acceptedOrders: acceptedOrdersSet.size,
    completedOrders: completedOrdersSet.size,
    cancelledOrders: cancelledOrdersSet.size,
    recentOrders,
  };
}

/**
 * 📈 Analytics theo thời gian cho seller
 */
export async function getSellerAnalytics(seller_id: string, days: number = 30) {
  const product_ids = (await prisma.product.findMany({ where: { seller_id }, select: { id: true } }))
    .map(p => p.id);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const order_items = await prisma.order_item.findMany({
    where: { 
      product_id: { in: product_ids },
      orders: { created_at: { gte: startDate } },
    },
    include: { orders: true, product: true },
  });

  const dailyStats: Record<string, { revenue: number; ordersSet: Set<string>; items: number }> = {};
  const productAgg: Record<string, { product_id: string; title: string; quantity: number; revenue: number }> = {};
  const statusCounts: Record<string, Set<string>> = {};

  order_items.forEach(item => {
    const date = item.orders.created_at.toISOString().split('T')[0];

    if (!dailyStats[date]) dailyStats[date] = { revenue: 0, ordersSet: new Set(), items: 0 };
    dailyStats[date].revenue += Number(item.price) * item.quantity;
    dailyStats[date].items += item.quantity;
    dailyStats[date].ordersSet.add(item.order_id);

    // Status
    if (!statusCounts[item.orders.status]) statusCounts[item.orders.status] = new Set();
    statusCounts[item.orders.status].add(item.order_id);

    // Top products
    if (!productAgg[item.product_id]) productAgg[item.product_id] = {
      product_id: item.product_id,
      title: item.product.title,
      quantity: 0,
      revenue: 0,
    };
    productAgg[item.product_id].quantity += item.quantity;
    productAgg[item.product_id].revenue += Number(item.price) * item.quantity;
  });

  // Tổng hợp
  const dailyStatsArr = Object.entries(dailyStats).map(([date, stats]) => ({
    date,
    revenue: stats.revenue,
    items: stats.items,
    orders: stats.ordersSet.size,
  }));

  const monthlyRevenue = order_items
    .filter(it => new Date(it.orders.created_at).getMonth() === new Date().getMonth())
    .reduce((sum, it) => sum + Number(it.price) * it.quantity, 0);

  const totalOrdersWindow = Object.values(statusCounts).reduce((acc, set) => acc + set.size, 0) || 1;
  const statusRatio = Object.fromEntries(Object.entries(statusCounts).map(([st, set]) => [st, set.size / totalOrdersWindow]));

  const topProducts = Object.values(productAgg).sort((a, b) => b.quantity - a.quantity).slice(0, 10);

  return {
    dailyStats: dailyStatsArr,
    totalRevenue: dailyStatsArr.reduce((sum, s) => sum + s.revenue, 0),
    totalOrders: dailyStatsArr.reduce((sum, s) => sum + s.orders, 0),
    totalItems: dailyStatsArr.reduce((sum, s) => sum + s.items, 0),
    monthlyRevenue,
    statusRatio,
    topProducts,
  };
}
