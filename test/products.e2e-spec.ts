import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { ProductsController } from '../src/products/products.controller';
import { ProductsService } from '../src/products/products.service';
import {
  PRODUCT_REPOSITORY,
  ProductRecord,
  ProductRepositoryPort,
} from '../src/products/repositories/product-repository.port';

class InMemoryProductRepository implements ProductRepositoryPort {
  private readonly products = new Map<number, ProductRecord>();
  private operationQueue = Promise.resolve();

  seed(product: ProductRecord): void {
    this.products.set(product.id, { ...product });
  }

  async findById(id: number): Promise<ProductRecord | null> {
    const product = this.products.get(id);
    return product ? { ...product } : null;
  }

  async decreaseStock(id: number, amount: number): Promise<ProductRecord | null> {
    const operation = this.operationQueue.then(async () => {
      const product = this.products.get(id);

      await new Promise((resolve) => setTimeout(resolve, 10));

      if (!product || product.stock < amount) {
        return null;
      }

      const updatedProduct: ProductRecord = {
        ...product,
        stock: product.stock - amount,
        updatedAt: new Date(),
      };

      this.products.set(id, updatedProduct);

      return { ...updatedProduct };
    });

    this.operationQueue = operation.then(
      () => undefined,
      () => undefined,
    );

    return operation;
  }
}

describe('ProductsController (e2e)', () => {
  let app: INestApplication;
  let productRepository: InMemoryProductRepository;

  const buildProduct = (overrides: Partial<ProductRecord> = {}): ProductRecord => ({
    id: 1,
    name: 'Keyboard',
    stock: 10,
    createdAt: new Date('2026-03-17T10:00:00.000Z'),
    updatedAt: new Date('2026-03-17T10:00:00.000Z'),
    ...overrides,
  });

  beforeEach(async () => {
    productRepository = new InMemoryProductRepository();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot({
          throttlers: [
            {
              name: 'default',
              ttl: 60_000,
              limit: 10,
            },
          ],
        }),
      ],
      controllers: [ProductsController],
      providers: [
        ProductsService,
        {
          provide: PRODUCT_REPOSITORY,
          useValue: productRepository,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should allow only one concurrent stock decrease when two requests target the same product', async () => {
    productRepository.seed(buildProduct({ stock: 1 }));

    const [firstResponse, secondResponse] = await Promise.all([
      request(app.getHttpServer())
        .post('/api/v1/products/1/decrease')
        .send({ amount: 1 }),
      request(app.getHttpServer())
        .post('/api/v1/products/1/decrease')
        .send({ amount: 1 }),
    ]);

    const statuses = [firstResponse.status, secondResponse.status].sort();
    expect(statuses).toEqual([200, 409]);

    const successfulResponse = [firstResponse, secondResponse].find(
      (response) => response.status === 200,
    );

    expect(successfulResponse?.body).toMatchObject({
      id: 1,
      name: 'Keyboard',
      stock: 0,
    });
    await expect(productRepository.findById(1)).resolves.toMatchObject({
      id: 1,
      stock: 0,
    });
  });

  it('should return 429 after exceeding 10 requests in one minute', async () => {
    productRepository.seed(buildProduct({ stock: 20 }));

    for (let attempt = 0; attempt < 10; attempt += 1) {
      await request(app.getHttpServer())
        .post('/api/v1/products/1/decrease')
        .send({ amount: 1 })
        .expect(200);
    }

    await request(app.getHttpServer())
      .post('/api/v1/products/1/decrease')
      .send({ amount: 1 })
      .expect(429);
  });
});
