import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from 'sequelize';
import { sequelize } from '../database.js';
import type { Purchase } from './Purchase.js';

export class Drop extends Model<
  InferAttributes<Drop>,
  InferCreationAttributes<Drop>
> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare price: number;
  declare totalStock: number;
  declare availableStock: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare purchases?: NonAttribute<Purchase[]>;
}

Drop.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('price') as unknown;
        return Number(value);
      },
    },
    totalStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 },
    },
    availableStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0 },
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'drops',
    indexes: [{ fields: ['createdAt'] }],
  },
);
