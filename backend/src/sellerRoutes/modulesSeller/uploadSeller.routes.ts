import { Router, RequestHandler } from 'express';
import { upload } from '../../middlewares/upload';
import { uploadSellerImage } from '../../controllers/seller/upload.controller';

const router = Router();

router.post(
  '/',
  upload.single('image') as unknown as RequestHandler, // force type
  uploadSellerImage
);

export default router;
