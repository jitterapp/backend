/* eslint-disable no-unused-vars */
'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class jit extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      jit.belongsTo(models.user, {
        foreignKey: 'userId',
        as: 'creator',
      });
      jit.hasMany(models.jitReply, {
        foreignKey: 'jitId',
        onDelete: 'CASCADE',
      });
      jit.hasMany(models.jitFavorite, {
        foreignKey: 'jitId',
        onDelete: 'CASCADE',
      });
      jit.hasMany(models.jitLike, {
        foreignKey: 'jitId',
        onDelete: 'CASCADE',
      });
      jit.hasMany(models.jitPrivate, {
        foreignKey: 'jitId',
        onDelete: 'CASCADE',
      });
    }
  }
  jit.init(
    {
      content: DataTypes.TEXT,
      ispublic: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      anonymous: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: 'jit',
    }
  );
  return jit;
};
