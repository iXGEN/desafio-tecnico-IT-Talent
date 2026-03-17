import { Injectable } from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<Product | null> {
    return this.prisma.product.findUnique({
      where: { id },
    });
  }

  async decreaseStock(id: number, amount: number): Promise<Product | null> {
    const [product] = await this.prisma.$queryRaw<Product[]>(Prisma.sql`
      UPDATE products
      SET stock = stock - ${amount},
          "updatedAt" = NOW()
      WHERE id = ${id}
        AND stock >= ${amount}
      RETURNING id, name, stock, "createdAt", "updatedAt"
    `);

    return product ?? null;
  }
}
