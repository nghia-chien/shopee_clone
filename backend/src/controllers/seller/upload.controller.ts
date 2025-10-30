import { Request, Response } from 'express';
import cloudinary from '../../utils/cloudinary';

type MulterRequest = Request & { file?: Express.Multer.File };

export const uploadSellerImage = async (req: MulterRequest, res: Response) => {
  try {
    
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    
    // Using memoryStorage → upload via buffer using upload_stream
    const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'seller_products' },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve({ secure_url: result.secure_url }); //, public_id: result.public_id (Hiện chỉ trả { url: ... }. Nếu muốn xóa hoặc update ảnh sau này, nên trả public_id nữa:)

        }
      );
      stream.end(req.file!.buffer);
    });

    return res.json({ url: uploadResult.secure_url });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'Upload failed' });
  }
  
};
