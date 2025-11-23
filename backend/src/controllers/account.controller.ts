import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth';
import cloudinary from '../utils/cloudinary';

type MulterRequest = Request & { file?: Express.Multer.File };

/**
 * Lấy thông tin user hiện tại
 * GET /api/account
 */
export async function getAccountController(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        phone_number: true,
        name: true,
        avatar: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json(user);
  } catch (error) {
    console.error('❌ getAccountController error:', error);
    return res.status(500).json({ message: 'getAccountController Internal server error' });
  }
}

/**
 * Cập nhật thông tin user (yêu cầu mật khẩu)
 * PUT /api/account
 */
export async function updateAccountController(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const { name, phone_number, password } = req.body as {
      name?: string;
      phone_number?: string;
      password: string; // Required để xác thực
    };

    if (!password) {
      return res.status(400).json({ message: 'Password is required to update account' });
    }

    // Verify password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { password: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone_number !== undefined && { phone_number }),
      },
      select: {
        id: true,
        email: true,
        phone_number: true,
        name: true,
        avatar: true,
        created_at: true,
        updated_at: true,
      },
    });

    return res.json(updatedUser);
  } catch (error: any) {
    console.error('❌ updateAccountController error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Phone number already exists' });
    }
    return res.status(500).json({ message: 'updateAccountController Internal server error' });
  }
}

/**
 * Upload avatar
 * POST /api/account/avatar
 */
export async function uploadAvatarController(req: AuthRequest & MulterRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!req.file) return res.status(400).json({ message: 'No file provided' });

    // FormData sends password as string in req.body
    const password = typeof req.body === 'object' && req.body !== null 
      ? (req.body.password || (req.body as any).password)
      : undefined;
    
    if (!password || typeof password !== 'string' || password.trim() === '') {
      return res.status(400).json({ message: 'Password is required to update avatar' });
    }

    // Verify password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { password: true, avatar: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Upload to cloudinary
    const uploadResult = await new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `users/${req.user!.id}/avatars` },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve(result.secure_url);
        }
      );
      stream.end(req.file!.buffer);
    });

    // Update user avatar
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatar: uploadResult },
      select: {
        id: true,
        email: true,
        phone_number: true,
        name: true,
        avatar: true,
        created_at: true,
        updated_at: true,
      },
    });

    return res.json(updatedUser);
  } catch (error: any) {
    console.error('❌ uploadAvatarController error:', error);
    return res.status(500).json({ message: error.message || 'uploadAvatarController Internal server error' });
  }
}

/**
 * Đổi mật khẩu
 * PUT /api/account/password
 */
export async function changePasswordController(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const { currentPassword, newPassword, confirmPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    };

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All password fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New password and confirm password do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    // Verify current password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { password: true },
    });

    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(401).json({ message: 'Invalid current password' });
    }

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: await bcrypt.hash(newPassword, 10) },
    });

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('❌ changePasswordController error:', error);
    return res.status(500).json({ message: 'changePasswordController Internal server error' });
  }
}

/**
 * Lấy danh sách địa chỉ
 * GET /api/account/addresses
 */
export async function getAddressesController(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const addresses = await prisma.address.findMany({
      where: { user_id: req.user.id },
      orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }],
    });

    return res.json({ addresses });
  } catch (error) {
    console.error('❌ getAddressesController error:', error);
    return res.status(500).json({ message: 'getAddressesController Internal server error' });
  }
}

/**
 * Thêm địa chỉ mới
 * POST /api/account/addresses
 */
export async function createAddressController(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const { full_name, phone, address_line, city, district, ward, province_id, district_id, ward_code, is_default } = req.body as {
      full_name: string;
      phone: string;
      address_line: string;
      city: string;
      district: string;
      ward: string;
      province_id?: number;
      district_id?: number;
      ward_code?: string;
      is_default?: boolean;
    };

    if (!full_name || !phone || !address_line || !city || !district || !ward) {
      return res.status(400).json({ message: 'All address fields are required' });
    }

    // Nếu đặt làm mặc định, bỏ mặc định của các địa chỉ khác
    if (is_default) {
      await prisma.address.updateMany({
        where: { user_id: req.user.id, is_default: true },
        data: { is_default: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        user_id: req.user.id,
        full_name,
        phone,
        address_line,
        city,
        district,
        ward,
        province_id: province_id ? Number(province_id) : null,
        district_id: district_id ? Number(district_id) : null,
        ward_code: ward_code || null,
        is_default: is_default || false,
      },
    });

    return res.status(201).json({ address });
  } catch (error) {
    console.error('❌ createAddressController error:', error);
    return res.status(500).json({ message: 'createAddressController Internal server error' });
  }
}

/**
 * Cập nhật địa chỉ
 * PUT /api/account/addresses/:id
 */
export async function updateAddressController(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const { id } = req.params;
    const { full_name, phone, address_line, city, district, ward, province_id, district_id, ward_code, is_default } = req.body as {
      full_name?: string;
      phone?: string;
      address_line?: string;
      city?: string;
      district?: string;
      ward?: string;
      province_id?: number;
      district_id?: number;
      ward_code?: string;
      is_default?: boolean;
    };

    // Check if address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: { id, user_id: req.user.id },
    });

    if (!existingAddress) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Nếu đặt làm mặc định, bỏ mặc định của các địa chỉ khác
    if (is_default === true) {
      await prisma.address.updateMany({
        where: { user_id: req.user.id, is_default: true, id: { not: id } },
        data: { is_default: false },
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data: {
        ...(full_name !== undefined && { full_name }),
        ...(phone !== undefined && { phone }),
        ...(address_line !== undefined && { address_line }),
        ...(city !== undefined && { city }),
        ...(district !== undefined && { district }),
        ...(ward !== undefined && { ward }),
        ...(province_id !== undefined && { province_id: province_id ? Number(province_id) : null }),
        ...(district_id !== undefined && { district_id: district_id ? Number(district_id) : null }),
        ...(ward_code !== undefined && { ward_code: ward_code || null }),
        ...(is_default !== undefined && { is_default }),
      },
    });

    return res.json({ address });
  } catch (error) {
    console.error('❌ updateAddressController error:', error);
    return res.status(500).json({ message: 'updateAddressController Internal server error' });
  }
}

/**
 * Xóa địa chỉ
 * DELETE /api/account/addresses/:id
 */
export async function deleteAddressController(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const { id } = req.params;

    // Check if address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: { id, user_id: req.user.id },
    });

    if (!existingAddress) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Không cho xóa địa chỉ mặc định nếu đó là địa chỉ duy nhất
    const addressCount = await prisma.address.count({
      where: { user_id: req.user.id },
    });

    if (addressCount === 1 && existingAddress.is_default) {
      return res.status(400).json({ message: 'Cannot delete the only default address' });
    }

    await prisma.address.delete({
      where: { id },
    });

    return res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('❌ deleteAddressController error:', error);
    return res.status(500).json({ message: 'deleteAddressController Internal server error' });
  }
}

/**
 * Đặt địa chỉ mặc định
 * PUT /api/account/addresses/:id/default
 */
export async function setDefaultAddressController(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const { id } = req.params;

    // Check if address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: { id, user_id: req.user.id },
    });

    if (!existingAddress) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Bỏ mặc định của các địa chỉ khác
    await prisma.address.updateMany({
      where: { user_id: req.user.id, is_default: true, id: { not: id } },
      data: { is_default: false },
    });

    // Đặt địa chỉ này làm mặc định
    const address = await prisma.address.update({
      where: { id },
      data: { is_default: true },
    });

    return res.json({ address });
  } catch (error) {
    console.error('❌ setDefaultAddressController error:', error);
    return res.status(500).json({ message: 'setDefaultAddressController Internal server error' });
  }
}

