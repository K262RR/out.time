import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Employee from './Employee.js';

class Report extends Model {}

Report.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Employee,
      key: 'id'
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  hours: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: false,
    validate: {
      min: 0,
      max: 24
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  approvedBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  approvedAt: {
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
  modelName: 'Report',
  tableName: 'reports',
  indexes: [
    {
      fields: ['employeeId']
    },
    {
      fields: ['date']
    },
    {
      fields: ['status']
    }
  ]
});

// Связи
Report.belongsTo(Employee, {
  foreignKey: 'employeeId',
  as: 'employee'
});

export default Report; 