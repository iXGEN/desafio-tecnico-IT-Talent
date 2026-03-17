import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { DecreaseStockDto } from './dto/decrease-stock.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number): Promise<ProductResponseDto> {
    return this.productsService.getById(id);
  }

  @Post(':id/decrease')
  @HttpCode(200)
  @UseGuards(ThrottlerGuard)
  @Throttle({
    default: {
      limit: 10,
      ttl: 60_000,
    },
  })
  decreaseStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() decreaseStockDto: DecreaseStockDto,
  ): Promise<ProductResponseDto> {
    return this.productsService.decreaseStock(id, decreaseStockDto.amount);
  }
}
