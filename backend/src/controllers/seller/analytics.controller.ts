import { Request, Response } from 'express';
import { SellerRequest } from '../../middlewares/authSeller';
import { getSellerOrderStats, getSellerAnalytics } from '../../services/seller/order.service';

/**
 * 📊 Lấy thống kê tổng quan
 */
export async function getSellerStatsController(req: SellerRequest, res: Response) {
  try {
    const sellerId = req.seller?.id;
    if (!sellerId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const stats = await getSellerOrderStats(sellerId);
    return res.json({ stats });
  } catch (error) {
    console.error('❌ getSellerStatsController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * 📈 Lấy analytics theo thời gian
 */
export async function getSellerAnalyticsController(req: SellerRequest, res: Response) {
  try {
    const sellerId = req.seller?.id;
    if (!sellerId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const days = parseInt(req.query.days as string) || 30;
    const analytics = await getSellerAnalytics(sellerId, days);
    return res.json({ analytics });
  } catch (error) {
    console.error('❌ getSellerAnalyticsController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

