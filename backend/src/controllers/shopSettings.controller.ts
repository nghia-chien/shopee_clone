import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { callGhnApi } from './shipping.controller';
import { validateAndFormatPhone } from './shipping.controller';
import type { AdminRequest } from '../middlewares/authAdmin';

/**
 * Lấy shop settings
 */
export async function getShopSettingsController(_req: Request, res: Response) {
  try {
    let settings = await prisma.shop_settings.findUnique({
      where: { id: 'shop_settings_singleton' },
    });

    // Nếu chưa có, tạo default từ env
    if (!settings) {
      const phone = process.env.SHIP_FROM_PHONE || '';
      const name = process.env.SHIP_FROM_NAME || 'Shop';
      const address = process.env.SHIP_FROM_ADDRESS || '';
      const wardCode = process.env.SHIP_FROM_WARD_CODE || '';
      const districtId = Number(process.env.SHIP_FROM_DISTRICT_ID || 0);

      settings = await prisma.shop_settings.create({
        data: {
          id: 'shop_settings_singleton',
          name: name,
          phone: phone,
          address_line: address,
          ward_code: wardCode || null,
          district_id: districtId || null,
        },
      });
    }

    return res.json({ settings });
  } catch (error: any) {
    console.error('Error getting shop settings:', error);
    return res.status(500).json({ message: 'Failed to get shop settings', error: error.message });
  }
}

/**
 * Cập nhật shop settings (yêu cầu admin auth)
 */
export async function updateShopSettingsController(req: AdminRequest, res: Response) {
  try {
    console.log('📥 PUT /api/shop-settings received');
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));

    const {
      name,
      phone,
      address_line,
      province_id,
      province_name,
      district_id,
      district_name,
      ward_code,
      ward_name,
      skip_validation, // Cho phép bypass validation nếu admin chắc chắn
    } = req.body;

    // Validate required fields
    if (!name || !phone || !address_line) {
      return res.status(400).json({ message: 'Name, phone, and address_line are required' });
    }

    // Validate phone number
    let validatedPhone: string;
    try {
      validatedPhone = validateAndFormatPhone(phone);
    } catch (error: any) {
      return res.status(400).json({ message: `Invalid phone number: ${error.message}` });
    }

    // CHECK: ward_code và district_id logic
    const hasWardCode = ward_code !== undefined && ward_code !== null && ward_code !== '';
    const hasDistrictId = district_id !== undefined && district_id !== null && district_id !== '';

    console.log('🔍 Validation check:', {
      hasWardCode,
      hasDistrictId,
      skip_validation,
      ward_code_value: ward_code,
      district_id_value: district_id,
    });

    // LOGIC FIX: Chỉ reject nếu có 1 trong 2 (không consistent)
    if (hasWardCode !== hasDistrictId) {
      return res.status(400).json({
        message: 'Cả ward_code và district_id đều phải được cung cấp hoặc cả hai đều để trống.',
      });
    }

    // Validate ward_code với GHN API nếu có CẢ HAI và KHÔNG skip validation
    if (hasWardCode && hasDistrictId && !skip_validation) {
      try {
        console.log('🔍 Validating ward_code with GHN:', {
          ward_code,
          ward_code_type: typeof ward_code,
          district_id,
          district_id_type: typeof district_id,
        });

        // Test ward_code với GHN API
        const wardsResponse = await callGhnApi(`/master-data/ward?district_id=${district_id}`, {
          method: 'POST',
          body: { district_id: Number(district_id) },
        });

        const wards = Array.isArray(wardsResponse)
          ? wardsResponse
          : Array.isArray((wardsResponse as any)?.data)
            ? (wardsResponse as any).data
            : [];

        console.log('📦 GHN wards response structure:', {
          has_data: wards.length > 0,
          data_length: wards.length,
          first_ward_sample:
            wards.length > 0
              ? {
                  WardCode: wards[0].WardCode,
                  WardCode_type: typeof wards[0].WardCode,
                  WardName: wards[0].WardName,
                }
              : 'no data',
        });

        if (wards.length === 0) {
          console.warn(`⚠️ District ${district_id} has 0 wards in GHN system`);
          return res.status(400).json({
            message: `District ${district_id} không có dữ liệu phường/xã trong GHN. Vui lòng kiểm tra lại District ID hoặc tick "Bỏ qua validation".`,
            available_wards: [],
            total_wards: 0,
          });
        }

        // So sánh ward_code với cả string và number (GHN có thể trả về string hoặc number)
        const wardExists = wards.some((w: any) => {
          const wardCode = String(w.WardCode || '').trim();
          const inputWardCode = String(ward_code || '').trim();
          return wardCode === inputWardCode;
        });

        if (!wardExists) {
          // Log tất cả ward codes để debug
          const availableWardCodes = wards.slice(0, 20).map((w: any) => ({
            code: String(w.WardCode || '').trim(),
            name: w.WardName,
          }));
          
          // Tìm ward code gần giống nhất (có thể do typo)
          const similarWard = wards.find((w: any) => {
            const wCode = String(w.WardCode || '').trim();
            const inputCode = String(ward_code || '').trim();
            // Kiểm tra nếu chỉ khác nhau về leading zeros hoặc format
            return wCode === inputCode || 
                   wCode.replace(/^0+/, '') === inputCode.replace(/^0+/, '') ||
                   inputCode.replace(/^0+/, '') === wCode.replace(/^0+/, '');
          });

          console.error('❌ Ward code not found:', {
            input_ward_code: ward_code,
            input_type: typeof ward_code,
            district_id,
            available_ward_codes_sample: availableWardCodes,
            total_wards: wards.length,
            similar_ward_found: similarWard ? {
              code: String(similarWard.WardCode || '').trim(),
              name: similarWard.WardName,
            } : null,
          });

          let errorMessage = `Ward code "${ward_code}" không tồn tại trong hệ thống GHN cho district ${district_id}. `;
          
          if (similarWard) {
            errorMessage += `Có thể bạn muốn dùng ward code "${String(similarWard.WardCode || '').trim()}" (${similarWard.WardName})? `;
          }
          
          errorMessage += `Vui lòng chọn lại phường/xã từ danh sách. ` +
            `(Tìm thấy ${wards.length} phường/xã cho district này)`;

          return res.status(400).json({
            message: errorMessage,
            available_wards: availableWardCodes,
            total_wards: wards.length,
          });
        }

        console.log('✅ Ward code validated successfully:', {
          ward_code,
          district_id,
        });
      } catch (error: any) {
        console.error('❌ Error validating ward_code with GHN:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
        });
        return res.status(400).json({
          message: `Không thể validate ward_code với GHN API: ${error.message}. Vui lòng thử lại.`,
        });
      }
    } else if (hasWardCode && hasDistrictId && skip_validation) {
      console.log('⚠️ Skipping ward_code validation as requested by admin');
    } else {
      console.log('ℹ️ No ward_code/district_id provided, skipping validation');
    }

    // Prepare data to save
    const dataToSave = {
      name,
      phone: validatedPhone,
      address_line,
      province_id: province_id ? Number(province_id) : null,
      province_name: province_name || null,
      district_id: district_id ? Number(district_id) : null,
      district_name: district_name || null,
      ward_code: ward_code || null,
      ward_name: ward_name || null,
      updated_at: new Date(),
    };

    console.log('💾 Data to save:', JSON.stringify(dataToSave, null, 2));

    // Update hoặc create settings
    const settings = await prisma.shop_settings.upsert({
      where: { id: 'shop_settings_singleton' },
      update: dataToSave,
      create: {
        id: 'shop_settings_singleton',
        ...dataToSave,
      },
    });

    console.log('✅ Saved successfully:', {
      id: settings.id,
      district_id: settings.district_id,
      ward_code: settings.ward_code,
    });

    // Verify bằng cách select lại
    const verified = await prisma.shop_settings.findUnique({
      where: { id: 'shop_settings_singleton' },
    });

    console.log('🔍 Verified from DB:', {
      district_id: verified?.district_id,
      ward_code: verified?.ward_code,
    });

    return res.json({ settings, message: 'Shop settings updated successfully' });
  } catch (error: any) {
    console.error('Error updating shop settings:', error);
    return res.status(500).json({ message: 'Failed to update shop settings', error: error.message });
  }
}