import { Request, Response } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth';
import { SellerRequest } from '../middlewares/authSeller';
import { AdminRequest } from '../middlewares/authAdmin';

type ComplaintType = 'PRODUCT_SHOP' | 'SELLER_USER' | 'SYSTEM';
type ComplaintStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
type ComplaintActor = 'USER' | 'SELLER' | 'ADMIN';

const complaintInclude: Prisma.complaintsInclude = {
  complaint_comments: {
    orderBy: { created_at: 'asc' },
    select: {
      id: true,
      sender_role: true,
      content: true,
      created_at: true,
      sender_id: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
  seller: {
    select: {
      id: true,
      name: true,
      email: true,
      phone_number: true,
    },
  },
  orders: {
    select: {
      id: true,
      status: true,
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
};

const VALID_TYPES: ComplaintType[] = ['PRODUCT_SHOP', 'SELLER_USER', 'SYSTEM'];
const VALID_STATUS: ComplaintStatus[] = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];

function ensureType(type?: string): ComplaintType {
  if (!type || !VALID_TYPES.includes(type as ComplaintType)) {
    throw new Error('INVALID_TYPE');
  }
  return type as ComplaintType;
}

function ensureStatus(status?: string): ComplaintStatus {
  if (!status || !VALID_STATUS.includes(status as ComplaintStatus)) {
    throw new Error('INVALID_STATUS');
  }
  return status as ComplaintStatus;
}

type AttachmentPayload = Record<string, any> | undefined | null;

function sanitizeJson(value: any): Prisma.JsonValue | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeJson(item))
      .filter((item): item is Prisma.JsonValue => item !== undefined);
  }
  if (typeof value === 'object') {
    const result: Record<string, Prisma.JsonValue> = {};
    for (const [key, val] of Object.entries(value)) {
      const sanitized = sanitizeJson(val);
      if (sanitized !== undefined) {
        result[key] = sanitized;
      }
    }
    return result;
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  return undefined;
}

function ensureAttachmentObject(value: Prisma.JsonValue | AttachmentPayload): Record<string, any> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, any>;
  }
  return {};
}

function buildInitialAttachment(actor: ComplaintActor, payload: any): Prisma.JsonObject {
  const now = new Date().toISOString();
  const attachment = {
    issueCode: payload?.issueCode ?? null,
    reason: payload?.reason ?? null,
    channel: payload?.channel ?? 'APP',
    context: sanitizeJson(payload?.context) ?? null,
    autoFill: sanitizeJson(payload?.autoFill) ?? null,
    evidence: Array.isArray(payload?.evidence)
      ? (sanitizeJson(payload?.evidence) ?? [])
      : [],
    createdBy: actor,
    timeline: [
      {
        by: actor,
        action: 'CREATED',
        at: now,
        note: payload?.description ?? null,
      },
    ],
    responses: {},
    notifications: [],
  };

  return (sanitizeJson(attachment) ?? {}) as Prisma.JsonObject;
}

function mergeAttachments(current: Prisma.JsonValue | AttachmentPayload, patch: AttachmentPayload): Prisma.JsonObject {
  const base = ensureAttachmentObject(current);
  const addon = ensureAttachmentObject(patch);

  const merged: Record<string, any> = { ...base, ...addon };

  if (base.responses || addon.responses) {
    merged.responses = { ...(base.responses ?? {}), ...(addon.responses ?? {}) };
  }
  if (base.context || addon.context) {
    merged.context = { ...(base.context ?? {}), ...(addon.context ?? {}) };
  }
  if (base.autoFill || addon.autoFill) {
    merged.autoFill = { ...(base.autoFill ?? {}), ...(addon.autoFill ?? {}) };
  }
  if (addon.timeline) {
    merged.timeline = [...(base.timeline ?? []), ...(addon.timeline ?? [])];
  }
  if (addon.evidence) {
    merged.evidence = [...new Set([...(base.evidence ?? []), ...addon.evidence])];
  }
  if (addon.notifications) {
    merged.notifications = [...(base.notifications ?? []), ...addon.notifications];
  }

  return (sanitizeJson(merged) ?? {}) as Prisma.JsonObject;
}

// Lấy khiếu nại của user
export async function getUserComplaintsController(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const complaints = await prisma.complaints.findMany({
      where: { user_id: req.user.id },
      include: complaintInclude,
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
      where: {
        seller_id: req.seller.id,
      },
      include: complaintInclude,
      orderBy: { created_at: 'desc' },
    });

    return res.json({ complaints });
  } catch (error) {
    console.error('❌ getSellerComplaintsController error:', error);
    return res.status(500).json({ message: 'getSellerComplaintsController Internal server error' });
  }
}

// Lấy khiếu nại cho admin với filter
export async function getAdminComplaintsController(req: AdminRequest, res: Response) {
  try {
    if (!req.admin) return res.status(401).json({ message: 'Unauthorized' });

    const { status, type, q } = req.query as { status?: ComplaintStatus; type?: ComplaintType; q?: string };
    const where: any = {};

    if (status && VALID_STATUS.includes(status)) {
      where.status = status;
    }
    if (type && VALID_TYPES.includes(type)) {
      where.type = type;
    }
    if (q) {
      where.OR = [
        { description: { contains: q, mode: 'insensitive' } },
        { user_complaints_user_idTouser: { name: { contains: q, mode: 'insensitive' } } },
        { seller: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [complaints, metrics] = await Promise.all([
      prisma.complaints.findMany({
        where,
        include: complaintInclude,
        orderBy: { created_at: 'desc' },
      }),
      prisma.complaints.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

    const overview = VALID_STATUS.map((state) => ({
      status: state,
      total: metrics.find((item) => item.status === state)?._count.status ?? 0,
    }));

    return res.json({ complaints, overview });
  } catch (error) {
    console.error('❌ getAdminComplaintsController error:', error);
    return res.status(500).json({ message: 'getAdminComplaintsController Internal server error' });
  }
}

// Tạo khiếu nại mới từ user
export async function createComplaintController(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const { seller_id, order_id, product_id, type, description, meta } = req.body as {
      seller_id?: string;
      order_id?: string;
      product_id?: string;
      type: ComplaintType;
      description?: string;
      meta?: Record<string, any>;
    };

    const complaintType = ensureType(type);

    if (complaintType === 'PRODUCT_SHOP' && !seller_id) {
      return res.status(400).json({ message: 'seller_id is required for PRODUCT_SHOP complaints' });
    }

    const complaintData = {
      user_id: req.user.id,
      seller_id: seller_id ?? null,
      order_id: order_id ?? null,
      product_id: product_id ?? null,
      type: complaintType,
      description,
      attachments: buildInitialAttachment('USER', { ...meta, description }),
      status: 'NEW',
    } as Prisma.complaintsUncheckedCreateInput;

    const complaint = await prisma.complaints.create({
      data: complaintData,
      include: complaintInclude,
    });

    return res.status(201).json({ complaint });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_TYPE') {
      return res.status(400).json({ message: 'Invalid complaint type' });
    }
    console.error('❌ createComplaintController error:', error);
    return res.status(500).json({ message: 'createComplaintController Internal server error' });
  }
}

// Seller tạo khiếu nại đến admin (SELLER_USER hoặc SYSTEM)
export async function createSellerComplaintController(req: SellerRequest, res: Response) {
  try {
    if (!req.seller) return res.status(401).json({ message: 'Unauthorized' });

    const { user_id, order_id, type, description, meta } = req.body as {
      user_id?: string;
      order_id?: string;
      type: ComplaintType;
      description?: string;
      meta?: Record<string, any>;
    };

    const complaintType = ensureType(type);

    if (complaintType === 'SELLER_USER' && !user_id) {
      return res.status(400).json({ message: 'user_id is required for SELLER_USER complaints' });
    }

    const complaintData = {
      user_id: user_id ?? null,
      seller_id: req.seller.id,
      order_id: order_id ?? null,
      type: complaintType,
      description,
      attachments: buildInitialAttachment('SELLER', { ...meta, description }),
      status: 'NEW',
    } as Prisma.complaintsUncheckedCreateInput;

    const complaint = await prisma.complaints.create({
      data: complaintData,
      include: complaintInclude,
    });

    return res.status(201).json({ complaint });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_TYPE') {
      return res.status(400).json({ message: 'Invalid complaint type' });
    }
    console.error('❌ createSellerComplaintController error:', error);
    return res.status(500).json({ message: 'createSellerComplaintController Internal server error' });
  }
}

// Seller phản hồi khiếu nại của user
export async function sellerRespondComplaintController(req: SellerRequest, res: Response) {
  try {
    if (!req.seller) return res.status(401).json({ message: 'Unauthorized' });
    const { complaintId } = req.params;
    const { message, evidence, status } = req.body as {
      message: string;
      evidence?: string[];
      status?: ComplaintStatus;
    };

    if (!message) {
      return res.status(400).json({ message: 'message is required' });
    }

    const complaint = await prisma.complaints.findUnique({
      where: { id: complaintId },
    });

    if (!complaint || complaint.seller_id !== req.seller.id) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const nextStatus =
      status && VALID_STATUS.includes(status) ? status : complaint.status === 'NEW' ? 'IN_PROGRESS' : complaint.status;

    const now = new Date().toISOString();
    const updatedAttachments = mergeAttachments(complaint.attachments, {
      responses: {
        seller: {
          message,
          updatedAt: now,
          evidence: evidence ?? [],
        },
      },
      timeline: [
        {
          by: 'SELLER',
          action: 'SELLER_RESPONSE',
          at: now,
          note: message,
        },
      ],
      evidence,
      notifications: [
        {
          to: 'USER',
          channel: 'IN_APP',
          message: 'Người bán đã phản hồi khiếu nại của bạn',
          at: now,
        },
      ],
    });

    const updated = await prisma.complaints.update({
      where: { id: complaintId },
      data: {
        status: nextStatus,
        updated_at: new Date(),
        attachments: updatedAttachments,
      },
      include: complaintInclude,
    });

    return res.json({ complaint: updated });
  } catch (error) {
    console.error('❌ sellerRespondComplaintController error:', error);
    return res.status(500).json({ message: 'sellerRespondComplaintController Internal server error' });
  }
}

// Admin cập nhật trạng thái/ghi chú
export async function adminRespondComplaintController(req: AdminRequest, res: Response) {
  try {
    if (!req.admin) return res.status(401).json({ message: 'Unauthorized' });

    const { complaintId } = req.params;
    const { status, note, notifyTarget } = req.body as {
      status: ComplaintStatus;
      note?: string;
      notifyTarget?: 'USER' | 'SELLER' | 'BOTH';
    };

    const nextStatus = ensureStatus(status);

    const complaint = await prisma.complaints.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const now = new Date().toISOString();
    const targets =
      notifyTarget === 'BOTH'
        ? ['USER', 'SELLER']
        : notifyTarget
          ? [notifyTarget]
          : ['USER', complaint.type === 'SELLER_USER' ? 'ADMIN' : 'SELLER'];

    const updatedAttachments = mergeAttachments(complaint.attachments, {
      responses: {
        admin: {
          note,
          status: nextStatus,
          updatedAt: now,
          actor: req.admin.name ?? 'Admin',
        },
      },
      timeline: [
        {
          by: 'ADMIN',
          action: 'STATUS_UPDATE',
          at: now,
          note,
        },
      ],
      notifications: targets.map((target) => ({
        to: target,
        channel: 'IN_APP',
        message: `Admin cập nhật trạng thái khiếu nại sang ${nextStatus}`,
        at: now,
      })),
    });

    const updated = await prisma.complaints.update({
      where: { id: complaintId },
      data: {
        status: nextStatus,
        updated_at: new Date(),
        attachments: updatedAttachments,
      },
      include: complaintInclude,
    });

    return res.json({ complaint: updated });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_STATUS') {
      return res.status(400).json({ message: 'Invalid status' });
    }
    console.error('❌ adminRespondComplaintController error:', error);
    return res.status(500).json({ message: 'adminRespondComplaintController Internal server error' });
  }
}

// Thêm thông tin bổ sung (user)
export async function addComplaintCommentController(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const { complaintId } = req.params;
    const { content } = req.body as { content: string };

    if (!content) {
      return res.status(400).json({ message: 'content is required' });
    }

    const comment = await prisma.complaint_comments.create({
      data: {
        complaint_id: complaintId,
        sender_id: req.user.id,
        sender_role: 'USER',
        content,
      },
    });

    return res.status(201).json({ comment });
  } catch (error) {
    console.error('❌ addComplaintCommentController error:', error);
    return res.status(500).json({ message: 'addComplaintCommentController Internal server error' });
  }
}
