import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return API information', () => {
      expect(appController.getApiInfo()).toEqual({
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
});
