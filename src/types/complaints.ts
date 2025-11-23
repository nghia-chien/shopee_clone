export type ComplaintType = 'PRODUCT_SHOP' | 'SELLER_USER' | 'SYSTEM';
export type ComplaintStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';

export interface ComplaintTimelineItem {
  by: 'USER' | 'SELLER' | 'ADMIN' | string;
  action: string;
  at: string;
  note?: string | null;
}

export interface ComplaintResponseMeta {
  message?: string;
  note?: string;
  status?: ComplaintStatus;
  updatedAt?: string;
  actor?: string;
  evidence?: string[];
}

export interface ComplaintMeta {
  issueCode?: string | null;
  reason?: string | null;
  channel?: string;
  context?: Record<string, any> | null;
  autoFill?: Record<string, any> | null;
  evidence?: string[];
  createdBy?: 'USER' | 'SELLER';
  responses?: {
    seller?: ComplaintResponseMeta;
    admin?: ComplaintResponseMeta;
  };
  timeline?: ComplaintTimelineItem[];
  notifications?: Array<{
    to: 'USER' | 'SELLER' | 'ADMIN';
    channel: string;
    message: string;
    at: string;
  }>;
}

export interface ComplaintComment {
  id: string;
  sender_role: string;
  content: string | null;
  created_at: string | null;
  sender_id: string;
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
}

export interface ComplaintRecord {
  id: string;
  type: ComplaintType;
  status: ComplaintStatus;
  description?: string | null;
  attachments?: ComplaintMeta | null;
  created_at: string;
  updated_at: string | null;
  order_id?: string | null;
  product_id?: string | null;
  seller_id?: string | null;
  user_id?: string | null;
  seller?: {
    id: string;
    name: string;
    email?: string | null;
    phone_number?: string | null;
  } | null;
  orders?: {
    id: string;
    status?: string | null;
    total?: string | number | null;
  } | null;
  product?: {
    id: string;
    title: string;
    images?: string[];
  } | null;
  user_complaints_user_idTouser?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
  complaint_comments?: ComplaintComment[];
}

export interface ComplaintDraft {
  type?: ComplaintType;
  seller_id?: string;
  user_id?: string;
  order_id?: string;
  product_id?: string;
  description?: string;
  meta?: {
    issueCode?: string;
    reason?: string;
    channel?: string;
    context?: Record<string, any>;
    autoFill?: Record<string, any>;
    evidence?: string[];
  };
}

