import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getApiInfo() {
    return {
      name: 'Product Stock API',
      description:
        'API REST para consultar productos y descontar stock con control de concurrencia y limitacion de solicitudes.',
      endpoints: {
        productDetail: 'GET /api/v1/products/:id',
        decreaseStock: 'POST /api/v1/products/:id/decrease',
      },
    };
  }
}
