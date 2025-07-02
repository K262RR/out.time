import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Company extends Model {}

Company.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  settings: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {
      workingHours: {
        start: '09:00',
        end: '18:00'
      },
      workingDays: [1, 2, 3, 4, 5], // Пн-Пт
      notificationTime: '17:00',
      timezone: 'Europe/Moscow'
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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
  modelName: 'Company',
  tableName: 'companies',
  indexes: [
    {
      fields: ['name']
    }
  ]
});

export default Company; 