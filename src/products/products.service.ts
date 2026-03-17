import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductResponseDto } from './dto/product-response.dto';
import {
  PRODUCT_REPOSITORY,
} from './repositories/product-repository.port';
import type { ProductRepositoryPort } from './repositories/product-repository.port';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
  ) {}

  async getById(id: number): Promise<ProductResponseDto> {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    return ProductResponseDto.fromRecord(product);
  }

  async decreaseStock(id: number, amount: number): Promise<ProductResponseDto> {
    const updatedProduct = await this.productRepository.decreaseStock(id, amount);

    if (updatedProduct) {
      return ProductResponseDto.fromRecord(updatedProduct);
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
