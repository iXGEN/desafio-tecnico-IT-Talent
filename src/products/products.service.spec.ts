import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import type {
  ProductRecord,
  ProductRepositoryPort,
} from './repositories/product-repository.port';

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepository: jest.Mocked<ProductRepositoryPort>;

  const baseProduct = (): ProductRecord => ({
    id: 1,
    name: 'Keyboard',
    stock: 10,
    createdAt: new Date('2026-03-17T10:00:00.000Z'),
    updatedAt: new Date('2026-03-17T10:00:00.000Z'),
  });

  beforeEach(() => {
    productRepository = {
      findById: jest.fn(),
      decreaseStock: jest.fn(),
    };

    service = new ProductsService(productRepository);
  });

  describe('decreaseStock', () => {
    it('should return the updated product when stock is successfully decreased', async () => {
      const updatedProduct: ProductRecord = {
        ...baseProduct(),
        stock: 7,
        updatedAt: new Date('2026-03-17T10:05:00.000Z'),
      };

      productRepository.decreaseStock.mockResolvedValue(updatedProduct);

      await expect(service.decreaseStock(1, 3)).resolves.toEqual(updatedProduct);
      expect(productRepository.decreaseStock).toHaveBeenCalledWith(1, 3);
      expect(productRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the product does not exist', async () => {
      productRepository.decreaseStock.mockResolvedValue(null);
      productRepository.findById.mockResolvedValue(null);

      await expect(service.decreaseStock(999, 1)).rejects.toThrow(
        new NotFoundException('Product with id 999 not found'),
      );
    });

    it('should throw ConflictException when the stock is insufficient', async () => {
      productRepository.decreaseStock.mockResolvedValue(null);
      productRepository.findById.mockResolvedValue(baseProduct());

      await expect(service.decreaseStock(1, 99)).rejects.toThrow(
        new ConflictException('Insufficient stock for product with id 1'),
      );
    });
  });
});
