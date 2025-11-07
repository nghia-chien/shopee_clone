import { prisma } from "../../utils/prisma";

export async function getSellerById(id: string) {
  return prisma.seller.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      rating: true,
      status: true,
      phone_number: true,
      address: true,
    },
  });
}
