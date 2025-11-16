import { Router } from 'express';
import { requireAuthSeller } from '../../middlewares/authSeller';
import {
//   createSellerOrderController,
//   listSellerOrdersController,
  listSellerSoldOrdersController,
  getSellerOrderController,
  getSellerOrderTimelineController,
  updateSellerOrderTrackingController,
} from '../../controllers/seller/order.controller';
import { updateSellerOrderStatusController } from '../../controllers/seller/updateOrderStatus.controller';

const router = Router();

// // Orders mà seller đã mua
// router.post('/', requireAuthSeller, createSellerOrderController);
// router.get('/purchased', requireAuthSeller, listSellerOrdersController);

// Orders mà seller đã bán (sản phẩm của seller được mua)
router.get('/sold', requireAuthSeller, listSellerSoldOrdersController);

// Chi tiết đơn hàng
router.get('/:id', requireAuthSeller, getSellerOrderController);
router.get('/:id/timeline', requireAuthSeller, getSellerOrderTimelineController);
router.post('/:id/tracking', requireAuthSeller, updateSellerOrderTrackingController);

// Cập nhật trạng thái đơn hàng (seller xác nhận/hủy/hoàn thành)
router.patch('/:id/status', requireAuthSeller, updateSellerOrderStatusController);

export default router;

