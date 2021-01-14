import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export default class CreateOrdersProducts1610584504138
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'orders_products',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'order_id',
            type: 'uuid',
          },
          {
            name: 'product_id',
            type: 'uuid',
          },
          {
            name: 'quantity',
            type: 'integer',
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 6,
            scale: 2,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
        foreignKeys: [
          {
            referencedTableName: 'orders',
            referencedColumnNames: ['id'],
            columnNames: ['order_id'],
          },
          {
            referencedTableName: 'products',
            referencedColumnNames: ['id'],
            columnNames: ['product_id'],
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('orders');
  }
}
