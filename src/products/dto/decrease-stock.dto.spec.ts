import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DecreaseStockDto } from './decrease-stock.dto';

describe('DecreaseStockDto', () => {
  it('should accept a positive integer amount', async () => {
    const dto = plainToInstance(DecreaseStockDto, { amount: '3' });

    const errors = await validate(dto);

    expect(dto.amount).toBe(3);
    expect(errors).toHaveLength(0);
  });

  it.each([0, -1, 1.5])(
    'should reject invalid amount %p',
    async (amount: number) => {
      const dto = plainToInstance(DecreaseStockDto, { amount });

      const errors = await validate(dto);

      expect(errors).not.toHaveLength(0);
    },
  );
});
