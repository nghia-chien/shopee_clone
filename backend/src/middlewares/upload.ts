import multer from 'multer';
export const upload = multer({ storage: multer.memoryStorage() });
import { Request, Response, NextFunction } from 'express';

export const authSeller = (req: Request, res: Response, next: NextFunction) => {
  // TypeScript chắc chắn headers tồn tại
  const authHeader = req.headers?.authorization;
  console.log('Auth header:', authHeader); // <-- log token tới backend

  if (!authHeader) return res.status(401).json({ error: 'Unauthorized middlewares/upload.ts header' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized middlewares/upload.ts tokentoken' });

  // verify token
  next();
};
