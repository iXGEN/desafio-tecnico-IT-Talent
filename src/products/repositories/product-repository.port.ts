export interface ProductRecord {
  id: number;
  name: string;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductRepositoryPort {
  findById(id: number): Promise<ProductRecord | null>;
  decreaseStock(id: number, amount: number): Promise<ProductRecord | null>;
}

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');
