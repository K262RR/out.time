import { DataTypes, Model } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import sequelize from '../config/database.js';

class Invite extends Model {
  static async create(data) {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    return await Invite.create({
      companyId: data.companyId,
      token,
      employeeName: data.employeeName,
      expiresAt,
      isUsed: false
    });
  }

  static async findByToken(token) {
    return await Invite.findOne({
      where: { token },
      include: [{
        model: sequelize.models.Company,
        attributes: ['name'],
        as: 'company'
      }]
    });
  }

  static async findValidByToken(token) {
    const now = new Date();
    return await Invite.findOne({
      where: {
        token,
        isUsed: false,
        expiresAt: {
          [sequelize.Op.gt]: now
        }
      },
      include: [{
        model: sequelize.models.Company,
        attributes: ['name'],
        as: 'company'
      }]
    });
  }

  static async markAsUsed(token) {
    const invite = await Invite.findOne({ where: { token } });
    if (invite) {
      invite.isUsed = true;
      invite.usedAt = new Date();
      await invite.save();
      return invite;
    }
    return null;
  }

  static async findByCompany(companyId) {
    return await Invite.findAll({
      where: { companyId },
      order: [['createdAt', 'DESC']]
    });
  }

  static async findActiveByCompany(companyId) {
    const now = new Date();
    return await Invite.findAll({
      where: {
        companyId,
        isUsed: false,
        expiresAt: {
          [sequelize.Op.gt]: now
        }
      },
      order: [['createdAt', 'DESC']]
    });
  }

  static async cleanupExpired() {
    const now = new Date();
    return await Invite.destroy({
      where: {
        expiresAt: {
          [sequelize.Op.lt]: now
        },
        isUsed: false
      }
    });
  }

  static async revoke(token) {
    const invite = await Invite.findOne({
      where: {
        token,
        isUsed: false
      }
    });
    if (invite) {
      invite.isUsed = true;
      invite.usedAt = new Date();
      await invite.save();
      return invite;
    }
    return null;
  }

  static async revokeByName(companyId, employeeName) {
    const now = new Date();
    const invites = await Invite.findAll({
      where: {
        companyId,
        employeeName,
        isUsed: false,
        expiresAt: {
          [sequelize.Op.gt]: now
        }
      }
    });

    for (const invite of invites) {
      invite.isUsed = true;
      invite.usedAt = new Date();
      await invite.save();
    }

    return invites;
  }
}

Invite.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'company_id',
    references: {
      model: 'companies',
      key: 'id'
    }
  },
  token: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true
  },
  employeeName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'employee_name'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'expires_at'
  },
  isUsed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_used'
  },
  usedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'used_at'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  sequelize,
  modelName: 'Invite',
  tableName: 'invites',
  timestamps: true
});

// Define associations
Invite.belongsTo(sequelize.models.Company, {
  foreignKey: 'companyId',
  as: 'company'
});

export default Invite; 