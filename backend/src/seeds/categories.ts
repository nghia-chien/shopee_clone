import { prisma } from '../utils/prisma';

const roots = [
  { name: 'Thời Trang Nam', slug: 'thoi-trang-nam' },
  { name: 'Điện Thoại & Phụ Kiện', slug: 'dien-thoai-phu-kien' },
  { name: 'Thiết Bị Điện Tử', slug: 'thiet-bi-dien-tu' },
  { name: 'Máy Tính & Laptop', slug: 'may-tinh-laptop' },
  { name: 'Máy Ảnh & Máy Quay Phim', slug: 'may-anh-may-quay' },
  { name: 'Đồng Hồ', slug: 'dong-ho' },
  { name: 'Giày Dép Nam', slug: 'giay-dep-nam' },
  { name: 'Thiết Bị Điện Gia Dụng', slug: 'thiet-bi-dien-gia-dung' },
  { name: 'Thể Thao & Du Lịch', slug: 'the-thao-du-lich' },
  { name: 'Ô Tô & Xe Máy & Xe Đạp', slug: 'o-to-xe-may-xe-dap' },
  { name: 'Thời Trang Nữ', slug: 'thoi-trang-nu' },
  { name: 'Mẹ & Bé', slug: 'me-be' },
  { name: 'Nhà Cửa & Đời Sống', slug: 'nha-cua-doi-song' },
  { name: 'Sắc Đẹp', slug: 'sac-dep' },
  { name: 'Sức Khỏe', slug: 'suc-khoe' },
  { name: 'Giày Dép Nữ', slug: 'giay-dep-nu' },
  { name: 'Túi Ví Nữ', slug: 'tui-vi-nu' },
  { name: 'Phụ Kiện & Trang Sức Nữ', slug: 'phu-kien-trang-suc-nu' },
  { name: 'Bách Hóa Online', slug: 'bach-hoa-online' },
  { name: 'Nhà Sách Online', slug: 'nha-sach-online' },
  { name: 'Balo & Túi Ví Nam', slug: 'balo-tui-vi-nam' },
  { name: 'Đồ Chơi', slug: 'do-choi' },
  { name: 'Chăm Sóc Thú Cưng', slug: 'cham-soc-thu-cung' },
  { name: 'Dụng Cụ & Tiện Ích', slug: 'dung-cu-tien-ich' },
  { name: 'Giặt Giũ & Chăm Sóc Nhà Cửa', slug: 'giat-giu-cham-soc-nha-cua' },
  { name: 'Voucher & Dịch Vụ', slug: 'voucher-dich-vu' },
  { name: 'Thời Trang Trẻ Em', slug: 'thoi-trang-tre-em' },
];

export async function seedCategories() {
  for (const r of roots) {
    const exists = await prisma.category.findUnique({ where: { slug: r.slug } });
    if (!exists) {
      await prisma.category.create({ data: { name: r.name, slug: r.slug, level: 1, path: [r.name] } });
    }
  }
}

// ESM-friendly direct execution
seedCategories().then(() => {
  console.log('Seeded categories');
  process.exit(0);
}).catch((e) => {
  console.error(e);
  process.exit(1);
});


