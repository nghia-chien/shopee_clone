import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth';
import { SellerRequest } from '../middlewares/authSeller';

// Lấy khiếu nại của user
export async function getUserComplaintsController(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const complaints = await prisma.complaints.findMany({
      where: { user_id: req.user.id },
      include: { 
        complaint_comments: { orderBy: { created_at: 'asc' } },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        orders: {
          select: {
            id: true,
            total: true,
          },
        },
        product: {
          select: {
            id: true,
            title: true,
            images: true,
          },
        },
        user_complaints_user_idTouser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return res.json({ complaints });
  } catch (error) {
    console.error('❌ getUserComplaintsController error:', error);
    return res.status(500).json({ message: 'getUserComplaintsController Internal server error' });
  }
}

// Lấy khiếu nại của seller
export async function getSellerComplaintsController(req: SellerRequest, res: Response) {
  try {
    if (!req.seller) return res.status(401).json({ message: 'Unauthorized' });

    const complaints = await prisma.complaints.findMany({
      where: { seller_id: req.seller.id },
      include: { 
        complaint_comments: { orderBy: { created_at: 'asc' } },
        user_complaints_user_idTouser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        orders: {
          select: {
            id: true,
            total: true,
          },
        },
        product: {
          select: {
            id: true,
            title: true,
            images: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return res.json({ complaints });
  } catch (error) {
    console.error('❌ getSellerComplaintsController error:', error);
    return res.status(500).json({ message: 'getSellerComplaintsController Internal server error' });
  }
}

// Tạo khiếu nại mới
export async function createComplaintController(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const { seller_id, order_id, product_id, type, description, attachments } = req.body as {
      seller_id: string;
      order_id?: string;
      product_id?: string;
      type: string;
      description?: string;
      attachments?: any;
    };

    if (!seller_id || !type) {
      return res.status(400).json({ message: 'seller_id and type are required' });
    }

    const complaint = await prisma.complaints.create({
      data: {
        user_id: req.user.id,
        seller_id,
        order_id,
        product_id,
        type,
        description,
        attachments,
        status: 'NEW',
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.status(201).json({ complaint });
  } catch (error) {
    console.error('❌ createComplaintController error:', error);
    return res.status(500).json({ message: 'createComplaintController Internal server error' });
  }
}

// Thêm comment vào khiếu nại
export async function addComplaintCommentController(req: Request, res: Response) {
  try {
    const { complaintId } = req.params;
    const { content } = req.body as { content: string };

    if (!content) {
      return res.status(400).json({ message: 'content is required' });
    }

    // Check if user or seller
    const authReq = req as AuthRequest;
    const sellerReq = req as SellerRequest;

    let senderId: string;
    let senderRole: 'ADMIN' | 'SELLER' | 'USER';

    if (authReq.user) {
      senderId = authReq.user.id;
      senderRole = 'USER';
    } else if (sellerReq.seller) {
      senderId = sellerReq.seller.id;
      senderRole = 'SELLER';
    } else {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const comment = await prisma.complaint_comments.create({
      data: {
        complaint_id: complaintId,
        sender_id: senderId,
        sender_role: senderRole,
        content,
      },
    });

    return res.status(201).json({ comment });
  } catch (error) {
    console.error('❌ addComplaintCommentController error:', error);
    return res.status(500).json({ message: 'addComplaintCommentController Internal server error' });
  }
}
