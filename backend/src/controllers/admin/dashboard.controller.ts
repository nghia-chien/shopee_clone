import { Request, Response } from 'express';
import { prisma } from '../../utils/prisma';

export async function getDashboardStatsController(req: Request, res: Response) {
  try {
    const period = req.query.period as string || 'month'; // 'week' or 'month'
    const now = new Date();
    
    let startDate: Date;
    let dateRange: string[];
    let dateKeyFormat: (date: Date) => string;
    let dateLabelFormat: (dateStr: string) => string;
    
    if (period === 'week') {
      // Get last 12 weeks
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 84); // 12 weeks ago
      startDate.setHours(0, 0, 0, 0);
      
      // Generate week keys
      dateRange = [];
      for (let i = 11; i >= 0; i--) {
        const weekDate = new Date(now);
        weekDate.setDate(now.getDate() - (i * 7));
        const weekStart = new Date(weekDate);
        weekStart.setDate(weekDate.getDate() - weekDate.getDay()); // Start of week (Sunday)
        const weekNum = Math.ceil((weekStart.getTime() - new Date(weekStart.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
        dateRange.push(`${weekStart.getFullYear()}-W${String(weekNum).padStart(2, '0')}`);
      }
      
      dateKeyFormat = (date: Date) => {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekNum = Math.ceil((weekStart.getTime() - new Date(weekStart.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
        return `${weekStart.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
      };
      
      dateLabelFormat = (dateStr: string) => {
        const [year, week] = dateStr.split('-W');
        const weekNum = parseInt(week);
        const date = new Date(parseInt(year), 0, 1 + (weekNum - 1) * 7);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `Tuần ${weekNum} (${weekStart.getDate()}/${weekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1})`;
      };
    } else {
      // Get last 12 months
      startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      startDate.setHours(0, 0, 0, 0);
      
      // Generate month keys
      dateRange = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        dateRange.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
      }
      
      dateKeyFormat = (date: Date) => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      };
      
      dateLabelFormat = (dateStr: string) => {
        const [year, month] = dateStr.split('-');
        const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
        return `${monthNames[parseInt(month) - 1]}/${year}`;
      };
    }

    // Orders per period - fetch all and group in memory
    const allOrders = await prisma.orders.findMany({
      where: {
        created_at: {
          gte: startDate,
        },
      },
      select: {
        created_at: true,
      },
    });

    const periodOrders: Record<string, number> = {};
    allOrders.forEach((order) => {
      const periodKey = dateKeyFormat(new Date(order.created_at));
      periodOrders[periodKey] = (periodOrders[periodKey] || 0) + 1;
    });

    // Users per period
    const allUsers = await prisma.user.findMany({
      where: {
        created_at: {
          gte: startDate,
        },
      },
      select: {
        created_at: true,
      },
    });

    const periodUsers: Record<string, number> = {};
    allUsers.forEach((user) => {
      const periodKey = dateKeyFormat(new Date(user.created_at));
      periodUsers[periodKey] = (periodUsers[periodKey] || 0) + 1;
    });

    // Sellers per period
    const allSellers = await prisma.seller.findMany({
      where: {
        created_at: {
          gte: startDate,
        },
      },
      select: {
        created_at: true,
      },
    });

    const periodSellers: Record<string, number> = {};
    allSellers.forEach((seller) => {
      const periodKey = dateKeyFormat(new Date(seller.created_at));
      periodSellers[periodKey] = (periodSellers[periodKey] || 0) + 1;
    });

    // Top products by order count
    const topProducts = await prisma.order_item.groupBy({
      by: ['product_id'],
      _count: {
        id: true,
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    const productIds = topProducts.map((p) => p.product_id);
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
        title: true,
        price: true,
        images: true,
      },
    });

    const topProductsWithDetails = topProducts.map((item) => {
      const product = products.find((p) => p.id === item.product_id);
      return {
        product_id: item.product_id,
        product_title: product?.title || 'N/A',
        product_price: product?.price || 0,
        product_image: product?.images?.[0] || null,
        order_count: item._count.id,
        total_quantity: item._sum.quantity || 0,
      };
    });

    // Fill in missing periods with 0
    const ordersData = dateRange.map((periodKey) => ({
      period: periodKey,
      label: dateLabelFormat(periodKey),
      count: periodOrders[periodKey] || 0,
    }));

    const usersData = dateRange.map((periodKey) => ({
      period: periodKey,
      label: dateLabelFormat(periodKey),
      count: periodUsers[periodKey] || 0,
    }));

    const sellersData = dateRange.map((periodKey) => ({
      period: periodKey,
      label: dateLabelFormat(periodKey),
      count: periodSellers[periodKey] || 0,
    }));

    return res.json({
      period,
      ordersByPeriod: ordersData,
      usersByPeriod: usersData,
      sellersByPeriod: sellersData,
      topProducts: topProductsWithDetails,
    });
  } catch (err: any) {
    console.error('getDashboardStatsController error:', err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
}

