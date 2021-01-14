import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

interface IGroupProduct {
  [key: string]: string | IProduct;
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) { }

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) throw new AppError('Customer does not exist');

    const groupProducts: IProduct[] = [];

    products.reduce((acc, product) => {
      if (!acc[product.id]) {
        acc[product.id] = { id: product.id, quantity: 0 };

        groupProducts.push(acc[product.id] as IProduct);
      }

      (acc[product.id] as IProduct).quantity += product.quantity;

      return acc;
    }, {} as IGroupProduct);

    const existingProducts = await this.productsRepository.findAllById(
      groupProducts,
    );

    if (!existingProducts.length) throw new AppError('Products not found');

    const productsIds = existingProducts.map(p => p.id);
    const nonexistentProducts = groupProducts.filter(
      p => !productsIds.includes(p.id),
    );

    if (nonexistentProducts.length)
      throw new AppError('Order with invalid products');

    const insufficientQuantities = existingProducts.filter(dbProduct => {
      const quantity =
        groupProducts.find(f => f.id === dbProduct.id)?.quantity || 0;

      return dbProduct.quantity < quantity;
    });

    if (insufficientQuantities.length)
      throw new AppError('Products with insufficient quantities');

    const serializedProducts = groupProducts.map(p => ({
      product_id: p.id,
      quantity: p.quantity,
      price: existingProducts.find(f => f.id === p.id)?.price || 0,
    }));

    const order = await this.ordersRepository.create({
      customer,
      products: serializedProducts,
    });

    const adjustQuantityProducts = existingProducts.map(p => ({
      id: p.id,
      quantity:
        p.quantity - (groupProducts.find(f => f.id === p.id)?.quantity || 0),
    }));

    await this.productsRepository.updateQuantity(adjustQuantityProducts);

    return order;
  }
}

export default CreateOrderService;
