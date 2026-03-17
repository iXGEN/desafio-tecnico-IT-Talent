import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Product } from '@prisma/client';
import { ProductRepository } from './repositories/product.repository';

@Injectable()
export class ProductsService {
  constructor(private readonly productRepository: ProductRepository) {}

  async getById(id: number): Promise<Product> {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    return product;
  }

  async decreaseStock(id: number, amount: number): Promise<Product> {
    const updatedProduct = await this.productRepository.decreaseStock(id, amount);

    if (updatedProduct) {
      return updatedProduct;
    }

    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    throw new ConflictException(
      `Insufficient stock for product with id ${id}`,
    );
  }
}
