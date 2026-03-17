import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  it('/api/v1 (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1')
      .expect(200)
      .expect({
        name: 'Product Stock API',
        description:
          'API REST para consultar productos y descontar stock con control de concurrencia y limitacion de solicitudes.',
        endpoints: {
          productDetail: 'GET /api/v1/products/:id',
          decreaseStock: 'POST /api/v1/products/:id/decrease',
        },
      });
  });
});
