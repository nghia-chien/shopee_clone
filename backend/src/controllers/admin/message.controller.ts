import { Request, Response } from 'express';
import { prisma } from '../../utils/prisma';

// GET ALL CHAT THREADS
export async function getAllThreadsController(req: Request, res: Response) {
  try {
    const { page = '1', limit = '20', search = '', userId, sellerId } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (userId) {
      where.user_id = userId as string;
    }
    if (sellerId) {
      where.seller_id = sellerId as string;
    }
    if (search) {
      where.OR = [
        { user: { name: { contains: search as string, mode: 'insensitive' } } },
        { user: { email: { contains: search as string, mode: 'insensitive' } } },
        { seller: { name: { contains: search as string, mode: 'insensitive' } } },
        { seller: { email: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    const [threads, total] = await Promise.all([
      prisma.chat_threads.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          seller: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          messages: {
            orderBy: { created_at: 'desc' },
            take: 1, // Lấy tin nhắn cuối cùng
          },
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { updated_at: 'desc' },
      }),
      prisma.chat_threads.count({ where }),
    ]);

    return res.json({
      items: threads,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    console.error('getAllThreadsController error:', err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
}

// GET THREAD BY ID WITH MESSAGES
export async function getThreadByIdController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const thread = await prisma.chat_threads.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        seller: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const [messages, totalMessages] = await Promise.all([
      prisma.messages.findMany({
        where: { thread_id: id },
        skip,
        take: limitNum,
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          seller: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.messages.count({ where: { thread_id: id } }),
    ]);

    return res.json({
      thread,
      messages: messages.reverse(), // Reverse để hiển thị từ cũ đến mới
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalMessages,
        totalPages: Math.ceil(totalMessages / limitNum),
      },
    });
  } catch (err: any) {
    console.error('getThreadByIdController error:', err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
}

// GET ALL MESSAGES (across all threads)
export async function getAllMessagesController(req: Request, res: Response) {
  try {
    const { page = '1', limit = '50', search = '', threadId, userId, sellerId } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (threadId) {
      where.thread_id = threadId as string;
    }
    if (userId) {
      where.user_id = userId as string;
    }
    if (sellerId) {
      where.seller_id = sellerId as string;
    }
    if (search) {
      where.content = { contains: search as string, mode: 'insensitive' };
    }

    const [messages, total] = await Promise.all([
      prisma.messages.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          seller: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          chat_threads: {
            select: { id: true, user_id: true, seller_id: true },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.messages.count({ where }),
    ]);

    return res.json({
      items: messages,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    console.error('getAllMessagesController error:', err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
}

// GET MESSAGE BY ID
export async function getMessageByIdController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const message = await prisma.messages.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        seller: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        chat_threads: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
            seller: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    return res.json({ message });
  } catch (err: any) {
    console.error('getMessageByIdController error:', err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
}

// DELETE MESSAGE (optional - for moderation)
export async function deleteMessageController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.messages.delete({ where: { id } });
    return res.json({ message: 'Xóa tin nhắn thành công' });
  } catch (err: any) {
    console.error('deleteMessageController error:', err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
}

