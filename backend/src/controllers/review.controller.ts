import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth';
import { SellerRequest } from '../middlewares/authSeller';
import {
  canReviewProduct,
  // canLikeReview,
  isProductOwner,
  calculateProductRating,
  validateMediaFiles,
} from '../services/review.service';
import cloudinary from '../utils/cloudinary';

type MulterRequest = Request & { files?: Express.Multer.File[] };

/**
 * Tạo review mới
 * POST /api/reviews
 * Body: { seller_order_id, product_id, rating, title?, content?, anonymous?, media?: File[] }
 */
export async function createReviewController(req: AuthRequest & MulterRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    // Parse values from FormData (all values come as strings)
    const { seller_order_id, product_id, rating, title, content, anonymous } = req.body as {
      seller_order_id: string;
      product_id: string;
      rating: string | number;
      title?: string;
      content?: string;
      anonymous?: string | boolean;
    };

    // Convert rating to number
    const ratingNum = typeof rating === 'string' ? parseInt(rating, 10) : rating;
    
    // Convert anonymous to boolean
    const anonymousBool = anonymous === 'true' || anonymous === true;

    if (!seller_order_id || !product_id || !ratingNum || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ message: 'seller_order_id, product_id and valid rating (1-5) are required' });
    }

    // Validate quyền review
    const { canReview, message, sellerOrder } = await canReviewProduct(req.user.id, seller_order_id, product_id);
    if (!canReview) {
      return res.status(403).json({ message: message || 'Cannot review this product' });
    }

    // Upload media files nếu có (max 5 files)
    const mediaFiles = (req.files as Express.Multer.File[]) || [];
    if (mediaFiles.length > 5) {
      return res.status(400).json({ message: 'Maximum 5 media files allowed' });
    }

    // Upload media và lưu thông tin type
    const mediaData: Array<{ url: string; type: 'IMAGE' | 'VIDEO' }> = [];
    for (const file of mediaFiles) {
      try {
        if (!file.buffer) {
          console.error('File buffer is missing');
          continue;
        }

        // Xác định type và resource_type dựa trên mimetype
        const isVideo = file.mimetype?.startsWith('video/') || false;
        const type: 'IMAGE' | 'VIDEO' = isVideo ? 'VIDEO' : 'IMAGE';
        
        // Cloudinary cần resource_type cho video
        const uploadOptions: any = {
          folder: `reviews/${product_id}`,
        };
        
        if (isVideo) {
          uploadOptions.resource_type = 'video';
          // Thêm các options cho video nếu cần
          uploadOptions.chunk_size = 6000000; // 6MB chunks
        }

        const url = await new Promise<string>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
              if (error) {
                console.error('Cloudinary upload error:', error);
                return reject(error);
              }
              if (!result) {
                console.error('Cloudinary upload: no result');
                return reject(new Error('Upload failed: no result'));
              }
              resolve(result.secure_url);
            }
          );
          stream.end(file.buffer);
        });

        console.log(`✅ Uploaded ${type}: ${url}`);
        mediaData.push({ url, type });
      } catch (error: any) {
        console.error(`❌ Error uploading media (${file.mimetype}):`, error.message || error);
        // Tiếp tục với các file khác nếu một file lỗi
      }
    }

    // Tạo review
    const review = await prisma.product_reviews.create({
      data: {
        product_id,
        user_id: req.user.id,
        seller_order_id: seller_order_id || undefined,
        rating: ratingNum,
        title: title || undefined,
        content: content || undefined,
        anonymous: anonymousBool,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Tạo review_media records
    if (mediaData.length > 0) {
      try {
        await Promise.all(
          mediaData.map((media) =>
            prisma.review_media.create({
              data: {
                review_id: review.id,
                type: media.type,
                url: media.url,
              },
            })
          )
        );
        console.log(`✅ Created ${mediaData.length} review_media records for review ${review.id}`);
      } catch (error: any) {
        console.error('❌ Error creating review_media records:', error);
        // Không throw error để review vẫn được tạo thành công
      }
    } else {
      console.log('⚠️ No media data to save for review');
    }

    // Tính toán lại rating sản phẩm
    await calculateProductRating(product_id);

    // Lấy review với media
    const reviewWithMedia = await prisma.product_reviews.findUnique({
      where: { id: review.id },
      include: {
        review_media: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.status(201).json({ review: reviewWithMedia });
  } catch (error: any) {
    console.error('❌ createReviewController error:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
}

/**
 * Lấy review theo product
 * GET /api/products/:id/reviews?page=1&limit=10
 */
export async function getProductReviewsController(req: Request, res: Response) {
  try {
    const productId = req.params.id || req.params.productId;
    
    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.product_reviews.findMany({
        where: { 
          product_id: productId, // Chỉ lấy reviews của product này
        },
        include: {
          review_replies: {
            include: {
              seller: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: { created_at: 'asc' },
          },
          review_media: {
            orderBy: { created_at: 'asc' },
          },
          user: {
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
      prisma.product_reviews.count({
        where: { product_id: productId },
      }),
    ]);

    return res.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('❌ getProductReviewsController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Like/Unlike review
 * POST /api/reviews/:id/like
 */
export async function likeReviewController(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const { reviewId } = req.params;

    // Validate quyền like
    // const { canLike, message } = await canLikeReview(req.user.id, reviewId);
    // if (!canLike) {
    //   return res.status(403).json({ message: message || 'Cannot like this review' });
    // }

    const review = await prisma.product_reviews.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if already liked
    const existingLike = await prisma.review_likes.findUnique({
      where: {
        review_id_user_id: {
          review_id: reviewId,
          user_id: req.user.id,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.review_likes.delete({
        where: {
          review_id_user_id: {
            review_id: reviewId,
            user_id: req.user.id,
          },
        },
      });

      await prisma.product_reviews.update({
        where: { id: reviewId },
        data: {
          like_count: Math.max(0, (review.like_count || 0) - 1),
        },
      });

      return res.json({ liked: false });
    } else {
      // Like
      await prisma.review_likes.create({
        data: {
          review_id: reviewId,
          user_id: req.user.id,
        },
      });

      await prisma.product_reviews.update({
        where: { id: reviewId },
        data: {
          like_count: (review.like_count || 0) + 1,
        },
      });

      return res.json({ liked: true });
    }
  } catch (error) {
    console.error('❌ likeReviewController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Lấy review cho seller
 * GET /api/seller/reviews?product_id=xxx
 */
export async function getSellerReviewsController(req: SellerRequest, res: Response) {
  try {
    if (!req.seller) return res.status(401).json({ message: 'Unauthorized' });

    const { product_id } = req.query as { product_id?: string };

    const where: any = {
      product: {
        seller_id: req.seller.id,
      },
    };

    if (product_id) {
      where.product_id = product_id;
    }

    const reviews = await prisma.product_reviews.findMany({
      where,
      include: {
        review_replies: {
          include: {
            seller: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        review_media: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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

    return res.json({ reviews });
  } catch (error) {
    console.error('❌ getSellerReviewsController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Seller reply review
 * POST /api/reviews/:id/reply
 */
export async function replyReviewController(req: SellerRequest, res: Response) {
  try {
    if (!req.seller) return res.status(401).json({ message: 'Unauthorized' });

    const { reviewId } = req.params;
    const { content } = req.body as { content: string };

    if (!content) {
      return res.status(400).json({ message: 'content is required' });
    }

    // Validate quyền reply
    const { isOwner, message } = await isProductOwner(req.seller.id, reviewId);
    if (!isOwner) {
      return res.status(403).json({ message: message || 'Cannot reply to this review' });
    }

    const reply = await prisma.review_replies.create({
      data: {
        review_id: reviewId,
        seller_id: req.seller.id,
        content,
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.status(201).json({ reply });
  } catch (error) {
    console.error('❌ replyReviewController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Update review
 * PUT /api/reviews/:id
 */
export async function updateReviewController(req: AuthRequest & MulterRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const { reviewId } = req.params;
    const { rating, title, content, anonymous } = req.body as {
      rating?: string | number;
      title?: string;
      content?: string;
      anonymous?: string | boolean;
    };

    // Parse values from FormData (all values come as strings)
    const ratingNum = rating !== undefined 
      ? (typeof rating === 'string' ? parseInt(rating, 10) : rating)
      : undefined;
    
    const anonymousBool = anonymous !== undefined
      ? (anonymous === 'true' || anonymous === true)
      : undefined;

    // Kiểm tra review tồn tại và thuộc về user
    const existingReview = await prisma.product_reviews.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (existingReview.user_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only update your own reviews' });
    }

    // Validate rating nếu có
    if (ratingNum !== undefined && (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5)) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Upload media files mới nếu có
    const mediaFiles = (req.files as Express.Multer.File[]) || [];
    if (mediaFiles.length > 5) {
      return res.status(400).json({ message: 'Maximum 5 media files allowed' });
    }

    // Upload media và lưu thông tin type
    const mediaData: Array<{ url: string; type: 'IMAGE' | 'VIDEO' }> = [];
    for (const file of mediaFiles) {
      try {
        if (!file.buffer) {
          console.error('File buffer is missing');
          continue;
        }

        // Xác định type và resource_type dựa trên mimetype
        const isVideo = file.mimetype?.startsWith('video/') || false;
        const type: 'IMAGE' | 'VIDEO' = isVideo ? 'VIDEO' : 'IMAGE';
        
        // Cloudinary cần resource_type cho video
        const uploadOptions: any = {
          folder: `reviews/${existingReview.product_id}`,
        };
        
        if (isVideo) {
          uploadOptions.resource_type = 'video';
          uploadOptions.chunk_size = 6000000; // 6MB chunks
        }

        const url = await new Promise<string>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
              if (error) {
                console.error('Cloudinary upload error:', error);
                return reject(error);
              }
              if (!result) {
                console.error('Cloudinary upload: no result');
                return reject(new Error('Upload failed: no result'));
              }
              resolve(result.secure_url);
            }
          );
          stream.end(file.buffer);
        });

        console.log(`✅ Uploaded ${type}: ${url}`);
        mediaData.push({ url, type });
      } catch (error: any) {
        console.error(`❌ Error uploading media (${file.mimetype}):`, error.message || error);
        // Tiếp tục với các file khác nếu một file lỗi
      }
    }

    // Update review
    const updatedReview = await prisma.product_reviews.update({
      where: { id: reviewId },
      data: {
        rating: ratingNum !== undefined ? ratingNum : undefined,
        title: title !== undefined ? title : undefined,
        content: content !== undefined ? content : undefined,
        anonymous: anonymousBool !== undefined ? anonymousBool : undefined,
        updated_at: new Date(),
      },
      include: {
        review_media: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Thêm media mới nếu có
    if (mediaData.length > 0) {
      try {
        await Promise.all(
          mediaData.map((media) =>
            prisma.review_media.create({
              data: {
                review_id: reviewId,
                type: media.type,
                url: media.url,
              },
            })
          )
        );
        console.log(`✅ Created ${mediaData.length} review_media records for review ${reviewId}`);
      } catch (error: any) {
        console.error('❌ Error creating review_media records:', error);
        // Không throw error để review vẫn được update thành công
      }
    } else {
      console.log('⚠️ No media data to save for review update');
    }

    // Tính toán lại rating nếu rating thay đổi
    if (rating !== undefined) {
      await calculateProductRating(existingReview.product_id);
    }

    // Lấy lại review với media mới
    const reviewWithMedia = await prisma.product_reviews.findUnique({
      where: { id: reviewId },
      include: {
        review_media: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.json({ review: reviewWithMedia });
  } catch (error: any) {
    console.error('❌ updateReviewController error:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
}

/**
 * Delete review
 * DELETE /api/reviews/:id
 */
export async function deleteReviewController(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const { reviewId } = req.params;

    // Kiểm tra review tồn tại và thuộc về user
    const existingReview = await prisma.product_reviews.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (existingReview.user_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own reviews' });
    }

    const productId = existingReview.product_id;

    // Xóa review (cascade sẽ xóa review_likes, review_media, review_replies)
    await prisma.product_reviews.delete({
      where: { id: reviewId },
    });

    // Tính toán lại rating sản phẩm
    await calculateProductRating(productId);

    return res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('❌ deleteReviewController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Lấy media của review
 * GET /api/reviews/:id/media
 */
export async function getReviewMediaController(req: Request, res: Response) {
  try {
    const { reviewId } = req.params;

    const media = await prisma.review_media.findMany({
      where: { review_id: reviewId },
      orderBy: { created_at: 'asc' },
    });

    return res.json({ media });
  } catch (error) {
    console.error('❌ getReviewMediaController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Lấy review của user
 * GET /api/reviews/user
 */
export async function getUserReviewsController(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const reviews = await prisma.product_reviews.findMany({
      where: { user_id: req.user.id },
      include: {
        review_replies: {
          include: {
            seller: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        review_media: true,
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

    return res.json({ reviews });
  } catch (error) {
    console.error('❌ getUserReviewsController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}



