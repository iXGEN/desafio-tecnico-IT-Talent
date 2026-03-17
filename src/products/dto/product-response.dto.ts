import { ProductRecord } from '../repositories/product-repository.port';

export class ProductResponseDto {
  id: number;
  name: string;
  stock: number;
  createdAt: Date;
  updatedAt: Date;

  static fromRecord(product: ProductRecord): ProductResponseDto {
    const response = new ProductResponseDto();
    response.id = product.id;
    response.name = product.name;
    response.stock = product.stock;
    response.createdAt = product.createdAt;
    response.updatedAt = product.updatedAt;

    return response;
  }
}
