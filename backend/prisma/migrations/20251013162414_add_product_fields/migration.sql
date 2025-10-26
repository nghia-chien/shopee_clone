-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "dimensions" JSONB,
ADD COLUMN     "discount" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "rating" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "reviews_count" INTEGER DEFAULT 0,
ADD COLUMN     "status" TEXT DEFAULT 'active',
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "weight" DOUBLE PRECISION;
