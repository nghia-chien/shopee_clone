import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import csvParser from 'csv-parser';

const prisma = new PrismaClient();

async function main() {
  const products = [];
  fs.createReadStream('apparel.csv')
    .pipe(csvParser())
    .on('data', (row) => {
      products.push({
        title: row.title,
        description: row.description,
        price: parseFloat(row.price),
        stock: parseInt(row.stock),
        images: JSON.parse(row.images),
        discount: parseFloat(row.discount),
        rating: parseFloat(row.rating),
        reviews_count: parseInt(row.reviews_count),
        tags: JSON.parse(row.tags),
        status: row.status,
        weight: parseFloat(row.weight),
        dimensions: JSON.parse(row.dimensions),
        brand: row.brand,
      });
    })
    .on('end', async () => {
      for (const product of products) {
        await prisma.product.create({ data: product });
      }
      console.log('Dữ liệu đã được nhập thành công!');
      await prisma.$disconnect();
    });
}

main();
