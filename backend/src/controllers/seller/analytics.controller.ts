import { Request, Response } from 'express';
import { SellerRequest } from '../../middlewares/authSeller';
import { getSellerOrderStats, getSellerAnalytics } from '../../services/seller/order.service';

/**
 * 📊 Lấy thống kê tổng quan
 */
export async function getSellerStatsController(req: SellerRequest, res: Response) {
  try {
    const seller_id = req.seller?.id;
    if (!seller_id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const stats = await getSellerOrderStats(seller_id);
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
    const seller_id = req.seller?.id;
    if (!seller_id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const days = parseInt(req.query.days as string) || 30;
    const analytics = await getSellerAnalytics(seller_id, days);
    return res.json({ analytics });
  } catch (error) {
    console.error('❌ getSellerAnalyticsController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function exportSellerAnalyticsController(req: SellerRequest, res: Response) {
  try {
    // TODO: implement analytics export (CSV/PDF)
    return res.status(501).json({ message: 'Not implemented yet' });
  } catch (error) {
    console.error('❌ exportSellerAnalyticsController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function sendSellerAnalyticsEmailController(req: SellerRequest, res: Response) {
  try {
    // TODO: implement scheduled analytics email report
    return res.status(501).json({ message: 'Not implemented yet' });
  } catch (error) {
    console.error('❌ sendSellerAnalyticsEmailController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

