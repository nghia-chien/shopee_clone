/*
  Warnings:

  - You are about to alter the column `phone_number` on the `seller` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - Added the required column `password` to the `seller` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "seller" ADD COLUMN     "password" TEXT NOT NULL,
ALTER COLUMN "phone_number" SET DATA TYPE VARCHAR(20);
