import { Request, Response } from 'express';
import { prisma } from '../../utils/prisma';
import { SellerRequest } from '../../middlewares/authSeller';
import { sendEmail } from '../../utils/email';

// /**
//  * 🛒 Tạo đơn hàng mới từ giỏ hàng (Seller mua hàng)
//  */
// export async function createSellerOrderController(req: SellerRequest, res: Response) {
//   try {
//     const seller_id = req.seller?.id;
//     if (!seller_id) {
//       return res.status(401).json({ message: 'Unauthorized' });
//     }

//     // ✅ Lấy giỏ hàng của seller
//     const cart_items = await prisma.cart_item.findMany({
//       where: { seller_id },
//       include: { product: true },
//     });

//     if (cart_items.length === 0) {
//       return res.status(400).json({ message: 'Cart is empty' });
//     }

//     // ✅ Tính tổng tiền
//     const total = cart_items.reduce((sum, item) => {
//       const price = Number(item.product.price);
//       return sum + price * item.quantity;
//     }, 0);

//     // ✅ Tạo đơn hàng + order_items
//     const order = await prisma.orders.create({
//       data: {
//         seller_id, // Seller mua hàng
//         total,
//         status: 'pending',
//         items: {
//           create: cart_items.map((item) => ({
//             product_id: item.product_id,
//             price: item.product.price,
//             quantity: item.quantity,
//           })),
//         },
//       },
//       include: {
//         items: { include: { product: true } },
//       },
//     });

//     // ✅ Xóa giỏ hàng sau khi đặt đơn
//     await prisma.cart_item.deleteMany({ where: { seller_id } });

//     // 📧 Gửi email xác nhận đơn hàng cho seller đã mua (nếu có SMTP)
//     const to = order.seller?.email;
//     if (to) {
//       const html = `
//         <h2>Đơn hàng đã được tạo</h2>
//         <p>Mã đơn: ${order.id}</p>
//         <p>Tổng tiền: ${Number(order.total).toLocaleString('vi-VN')} VND</p>
//         <p>Trạng thái: ${order.status}</p>
//       `;
//       await sendEmail(to, 'Xác nhận tạo đơn hàng', html);
//     }

//     return res.status(201).json(order);
//   } catch (error) {
//     console.error('❌ createSellerOrderController error:', error);
//     return res.status(500).json({ message: 'Internal server error' });
//   }
// }

// /**
//  * 📋 Lấy danh sách đơn hàng (Seller đã mua)
//  */
// export async function listSellerOrdersController(req: SellerRequest, res: Response) {
//   try {
//     const seller_id = req.seller?.id;
//     if (!seller_id) {
//       return res.status(401).json({ message: 'Unauthorized' });
//     }

//     const orders = await prisma.orders.findMany({
//       where: { seller_id }, // Orders mà seller đã mua
//       include: {
//         items: {
//           include: {
//             product: {
//               include: {
//                 seller: {
//                   select: { name: true, email: true },
//                 },
//               },
//             },
//           },
//         },
//       },
//       orderBy: { created_at: 'desc' },
//     });

//     return res.json({ orders });
//   } catch (error) {
//     console.error('❌ listSellerOrdersController error:', error);
//     return res.status(500).json({ message: 'Internal server error' });
//   }
// }

/**
 * 📦 Lấy danh sách đơn hàng đã bán của seller
 */
/**
 * 📦 Lấy danh sách đơn hàng đã bán của seller
 */
export async function listSellerSoldOrdersController(req: SellerRequest, res: Response) {
  try {
    const seller_id = req.seller?.id;
    if (!seller_id) return res.status(401).json({ message: 'Unauthorized' });

    const orders = await prisma.seller_order.findMany({
    where: { seller_id },
    include: {
      orders: {
        include: {
          user: { select: { name: true, email: true, phone_number: true } },
          order_item: {
            include: {
              product: { select: { id: true, title: true, images: true } },
            },
          },
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });


    return res.json({ orders });
  } catch (error) {
    console.error('❌ listSellerSoldOrdersController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * 🔍 Lấy chi tiết một đơn hàng của seller
 */
export async function getSellerOrderController(req: SellerRequest, res: Response) {
  try {
    const seller_id = req.seller?.id;
    if (!seller_id) return res.status(401).json({ message: 'Unauthorized' });

    const { id } = req.params;

    const sellerOrder = await prisma.seller_order.findFirst({
      where: { id, seller_id },
      include: {
        orders: {
          include: {
            user: { select: { name: true, email: true, phone_number: true } },
            order_item: { // từ orders lấy ra các sản phẩm
              include: {
                product: { select: { id: true, title: true, images: true } },
              },
            },
          },
        },
      },
    });


    if (!sellerOrder) return res.status(404).json({ message: 'Seller order not found' });

    return res.json({ sellerOrder });
  } catch (error) {
    console.error('❌ getSellerOrderController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

