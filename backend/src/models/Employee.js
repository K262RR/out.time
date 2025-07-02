import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Company from './Company.js';

class Employee extends Model {}

Employee.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Company,
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  position: {
    type: DataTypes.STRING,
    allowNull: true
  },
  telegramId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastActive: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'Employee',
  tableName: 'employees',
  indexes: [
    {
      fields: ['companyId']
    },
    {
      fields: ['email']
    },
    {
      fields: ['telegramId']
    }
  ]
});

// Связи
Employee.belongsTo(Company, {
  foreignKey: 'companyId',
  as: 'company'
});

export default Employee; 