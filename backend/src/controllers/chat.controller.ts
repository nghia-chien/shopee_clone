import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { SellerRequest } from '../middlewares/authSeller';
import {
  createThreadIfNotExist,
  sendMessage as sendMessageService,
  sendSystemMessage as sendSystemMessageService,
  updateOrderMessageStatus,
} from '../services/chat.service';
import { prisma } from '../utils/prisma';

/**
 * Lấy tất cả thread của user
 */
export async function getThreadsByUserController(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const threads = await prisma.chat_threads.findMany({
      where: { user_id: req.user.id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            
          },
        },
        messages: {
          orderBy: { created_at: 'desc' },
          take: 1, // Lấy tin nhắn cuối cùng
        },
      },
      orderBy: { updated_at: 'desc' },
    });

    return res.json({ threads });
  } catch (error) {
    console.error('❌ getThreadsByUserController error:', error);
    return res.status(500).json({ message: 'getThreadsByUserController Internal server error' });
  }
}

/**
 * Lấy tất cả thread của seller
 */
export async function getThreadsBySellerController(req: SellerRequest, res: Response) {
  try {
    if (!req.seller) return res.status(401).json({ message: 'Unauthorized' });

    const threads = await prisma.chat_threads.findMany({
      where: { seller_id: req.seller.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        messages: {
          orderBy: { created_at: 'desc' },
          take: 1, // Lấy tin nhắn cuối cùng
        },
      },
      orderBy: { updated_at: 'desc' },
    });

    return res.json({ threads });
  } catch (error) {
    console.error('❌ getThreadsBySellerController error:', error);
    return res.status(500).json({ message: 'getThreadsBySellerController Internal server error' });
  }
}

/**
 * Tạo thread mới hoặc trả về thread đã tồn tại
 */
export async function createThreadController(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const { sellerId } = req.body as { sellerId: string };

    if (!sellerId) {
      return res.status(400).json({ message: 'sellerId is required' });
    }

    // Kiểm tra seller tồn tại
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
    });

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    const thread = await createThreadIfNotExist(req.user.id, sellerId);

    return res.json({ thread });
  } catch (error) {
    console.error('❌ createThreadController error:', error);
    return res.status(500).json({ message: 'createThreadController Internal server error' });
  }
}

/**
 * Gửi tin nhắn - User version
 */
export async function sendUserMessageController(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const { threadId, content, attachments } = req.body as {
      threadId: string;
      content: string;
      attachments?: any;
    };

    if (!threadId || !content) {
      return res.status(400).json({ message: 'threadId and content are required' });
    }

    const message = await sendMessageService(threadId, 'USER', req.user.id, null, content, attachments);

    return res.json({ message });
  } catch (error: any) {
    console.error('❌ sendUserMessageController error:', error);
    return res.status(500).json({ message: error.message || 'sendUserMessageController Internal server error' });
  }
}

/**
 * Gửi tin nhắn - Seller version
 */
export async function sendSellerMessageController(req: SellerRequest, res: Response) {
  try {
    if (!req.seller) return res.status(401).json({ message: 'Unauthorized' });

    const { threadId, content, attachments } = req.body as {
      threadId: string;
      content: string;
      attachments?: any;
    };

    if (!threadId || !content) {
      return res.status(400).json({ message: 'threadId and content are required' });
    }

    const message = await sendMessageService(threadId, 'SELLER', null, req.seller.id, content, attachments);

    return res.json({ message });
  } catch (error: any) {
    console.error('❌ sendSellerMessageController error:', error);
    return res.status(500).json({ message: error.message || 'sendSellerMessageController Internal server error' });
  }
}

/**
 * Lấy tin nhắn trong thread (có pagination) - User version
 */
export async function getMessagesController(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const { threadId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    if (!threadId) {
      return res.status(400).json({ message: 'threadId is required' });
    }

    // Kiểm tra thread tồn tại và user có quyền truy cập
    const thread = await prisma.chat_threads.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    // Kiểm tra quyền truy cập
    if (thread.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const [messages, total] = await Promise.all([
      prisma.messages.findMany({
        where: { thread_id: threadId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip,
      }),
      prisma.messages.count({
        where: { thread_id: threadId },
      }),
    ]);

    return res.json({
      messages: messages.reverse(), // Reverse để hiển thị từ cũ đến mới
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('❌ getMessagesController error:', error);
    return res.status(500).json({ message: 'getMessagesController Internal server error' });
  }
}

/**
 * Lấy tin nhắn trong thread (có pagination) - Seller version
 */
export async function getSellerMessagesController(req: SellerRequest, res: Response) {
  try {
    if (!req.seller) return res.status(401).json({ message: 'Unauthorized' });

    const { threadId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    if (!threadId) {
      return res.status(400).json({ message: 'threadId is required' });
    }

    // Kiểm tra thread tồn tại và seller có quyền truy cập
    const thread = await prisma.chat_threads.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    // Kiểm tra quyền truy cập
    if (thread.seller_id !== req.seller.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const [messages, total] = await Promise.all([
      prisma.messages.findMany({
        where: { thread_id: threadId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip,
      }),
      prisma.messages.count({
        where: { thread_id: threadId },
      }),
    ]);

    return res.json({
      messages: messages.reverse(), // Reverse để hiển thị từ cũ đến mới
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('❌ getSellerMessagesController error:', error);
    return res.status(500).json({ message: 'getSellerMessagesController Internal server error' });
  }
}

/**
 * Gửi tin nhắn hệ thống (chỉ dùng nội bộ, không expose qua API công khai)
 * Hoặc có thể dùng khi seller cập nhật trạng thái đơn
 */
export async function sendSystemMessageController(req: SellerRequest, res: Response) {
  try {
    if (!req.seller) return res.status(401).json({ message: 'Unauthorized' });

    const { threadId, orderId, status } = req.body as {
      threadId: string;
      orderId: string;
      status: string;
    };

    if (!threadId || !orderId || !status) {
      return res.status(400).json({ message: 'threadId, orderId, and status are required' });
    }

    // Kiểm tra seller có quyền với order này không
    const sellerOrder = await prisma.seller_order.findFirst({
      where: {
        order_id: orderId,
        seller_id: req.seller.id,
      },
    });

    if (!sellerOrder) {
      return res.status(403).json({ message: 'Access denied to this order' });
    }

    const message = await sendSystemMessageService(threadId, orderId, status);

    return res.json({ message });
  } catch (error: any) {
    console.error('❌ sendSystemMessageController error:', error);
    return res.status(500).json({ message: error.message || 'sendSystemMessageController Internal server error' });
  }
}
