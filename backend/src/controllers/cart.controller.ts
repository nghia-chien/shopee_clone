import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

// 🧾 Lấy toàn bộ giỏ hàng của người dùng
export async function listcart_itemsController(req: Request & { user?: { id: string } }, res: Response) {
  try {
    const user_id = req.user?.id;
    
    if (!user_id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const items = await prisma.cart_item.findMany({
      where: { user_id },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            discount: true,
            images: true,
            seller_id: true, // ← THÊM DÒNG NÀY
            stock: true,
          }
        },
        product_variant: true,
      },
    });

    // Map lại dữ liệu cho frontend
    const mappedItems = items.map(item => ({
      id: item.id,
      quantity: item.quantity,
      product: {
        id: item.product.id,
        seller_id: item.product.seller_id, // ← THÊM DÒNG NÀY
        title: item.product.title,
        price: Number(item.product.price),
        discount: Number(item.product.discount || 0),
        images: item.product.images,
        stock: item.product.stock,
      },
      variant: item.product_variant
        ? {
            id: item.product_variant.id,
            title: item.product_variant.title,
            price: Number(item.product_variant.price),
            image: item.product_variant.image,
            stock: item.product_variant.stock,
          }
        : null,
    }));

    console.log('🛒 Cart items với seller_id:', mappedItems); // ← Debug

    return res.json({ items: mappedItems });
  } catch (error) {
    console.error('Error fetching cart items:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ➕ Thêm sản phẩm vào giỏ hàng
export async function addToCartController(req: Request & { user?: { id: string } }, res: Response) { 
  try {
    const user_id = req.user?.id;
    const { product_id, variant_id, quantity } = req.body;

    console.log('📥 Received cart data:', { user_id, product_id, variant_id, quantity });

    // Validate input
    if (!user_id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!product_id || !quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      return res.status(400).json({ message: 'Invalid input data' });
    }

    // Kiểm tra product có tồn tại không
    const product = await prisma.product.findUnique({
      where: { id: product_id },
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Nếu có variant_id, kiểm tra variant có tồn tại và thuộc product không
    if (variant_id) {
      const variant = await prisma.product_variant.findUnique({
        where: { id: variant_id },
      });

      if (!variant || variant.product_id !== product_id) {
        return res.status(404).json({ message: 'Variant not found or does not belong to product' });
      }
    }

    // Tìm existing item - XỬ LÝ KHÁC NHAU CHO variant_id null vs có giá trị
    let existingItem;
    
    if (variant_id) {
      // Trường hợp có variant_id - dùng findUnique
      existingItem = await prisma.cart_item.findUnique({
        where: {
          user_id_product_id_variant_id: {
            user_id,
            product_id,
            variant_id,
          },
        },
      });
    } else {
      // Trường hợp không có variant_id (null) - dùng findFirst
      existingItem = await prisma.cart_item.findFirst({
        where: {
          user_id,
          product_id,
          variant_id: null,
        },
      });
    }

    console.log('🔍 Existing item:', existingItem);

    let cart_item;
    if (existingItem) {
      // Update existing item
      cart_item = await prisma.cart_item.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + Number(quantity) },
      });
    } else {
      // Create new item
      cart_item = await prisma.cart_item.create({
        data: {
          user_id,
          product_id,
          variant_id: variant_id || null,
          quantity: Number(quantity),
        },
      });
    }

    console.log('✅ Cart operation successful:', cart_item);
    return res.json(cart_item);

  } catch (error) {
    console.error('❌ Error adding to cart:');
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error details:', errorMessage);

    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
}

// ✏️ Cập nhật số lượng sản phẩm trong giỏ
export async function updatecart_itemController(req: Request & { user?: { id: string } }, res: Response) {
  try {
    const user_id = req.user?.id;
    const { product_id, variant_id, quantity } = req.body;

    if (!user_id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!product_id || isNaN(Number(quantity)) || Number(quantity) < 0) {
      return res.status(400).json({ message: 'Invalid input data' });
    }

    // Tìm cart item - XỬ LÝ KHÁC NHAU CHO variant_id null vs có giá trị
    let cart_item;
    
    if (variant_id) {
      // Trường hợp có variant_id
      cart_item = await prisma.cart_item.findUnique({
        where: {
          user_id_product_id_variant_id: {
            user_id,
            product_id,
            variant_id,
          },
        },
      });
    } else {
      // Trường hợp không có variant_id (null)
      cart_item = await prisma.cart_item.findFirst({
        where: {
          user_id,
          product_id,
          variant_id: null,
        },
      });
    }

    if (!cart_item) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    // Nếu quantity = 0, xóa item khỏi giỏ hàng
    if (Number(quantity) === 0) {
      await prisma.cart_item.delete({
        where: { id: cart_item.id },
      });
      return res.json({ message: 'Item removed from cart' });
    }

    // Cập nhật số lượng
    const updated = await prisma.cart_item.update({
      where: { id: cart_item.id },
      data: { quantity: Number(quantity) },
    });

    return res.json(updated);
  } catch (error) {
    console.error('Error updating cart item:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
}

// 🗑️ Xóa sản phẩm khỏi giỏ hàng - SỬA LẠI
export async function removecart_itemController(req: Request & { user?: { id: string } }, res: Response) {
  try {
    const user_id = req.user?.id;
    const { product_id, variant_id } = req.params;

    console.log('🗑️ Delete request:', { user_id, product_id, variant_id });

    if (!user_id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!product_id) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    // Xác định variant_id chính xác
    let finalVariantId: string | null = null;
    if (variant_id && variant_id !== 'null' && variant_id !== 'undefined') {
      finalVariantId = variant_id;
    }

    console.log('🔍 Finding cart item with:', { user_id, product_id, variant_id: finalVariantId });

    // Tìm cart item - XỬ LÝ KHÁC NHAU CHO variant_id null vs có giá trị
    let cart_item;
    
    if (finalVariantId) {
      // Trường hợp có variant_id
      cart_item = await prisma.cart_item.findUnique({
        where: {
          user_id_product_id_variant_id: {
            user_id,
            product_id,
            variant_id: finalVariantId,
          },
        },
      });
    } else {
      // Trường hợp không có variant_id (null)
      cart_item = await prisma.cart_item.findFirst({
        where: {
          user_id,
          product_id,
          variant_id: null,
        },
      });
    }

    console.log('🔍 Found cart item:', cart_item);

    if (!cart_item) {
      console.log('❌ Cart item not found');
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    await prisma.cart_item.delete({ 
      where: { id: cart_item.id } 
    });

    console.log('✅ Cart item deleted successfully');
    return res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('❌ Error removing cart item:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
}

// 📦 Lấy tổng số lượng sản phẩm trong giỏ (tính tổng quantity)
export const getCartCountController = async (
  req: Request & { user?: { id: string } },
  res: Response
) => {
  try {
    const user_id = req.user?.id;
    
    if (!user_id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Tính tổng quantity của tất cả items trong giỏ hàng
    const result = await prisma.cart_item.aggregate({
      where: { user_id },
      _sum: {
        quantity: true,
      },
    });

    const count = result._sum.quantity || 0;

    return res.json({ count });
  } catch (error) {
    console.error('Failed to get cart count:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
};
