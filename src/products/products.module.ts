import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductRepository } from './repositories/product.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { PRODUCT_REPOSITORY } from './repositories/product-repository.port';

@Module({
  imports: [PrismaModule],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    ProductRepository,
    {
      provide: PRODUCT_REPOSITORY,
      useExisting: ProductRepository,
    },
  ],
})
export class ProductsModule {}
