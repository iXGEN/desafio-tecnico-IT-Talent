import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ProductRecord,
  ProductRepositoryPort,
} from './product-repository.port';

@Injectable()
export class ProductRepository implements ProductRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<ProductRecord | null> {
    return this.prisma.product.findUnique({
      where: { id },
    });
  }

  async decreaseStock(id: number, amount: number): Promise<ProductRecord | null> {
    const [product] = await this.prisma.$queryRaw<ProductRecord[]>`
      UPDATE products
      SET stock = stock - ${amount},
          "updatedAt" = NOW()
      WHERE id = ${id}
        AND stock >= ${amount}
      RETURNING id, name, stock, "createdAt", "updatedAt"
    `;

    return product ?? null;
  }
}
