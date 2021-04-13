/* eslint-disable no-unused-vars */
'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class friend extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      friend.hasOne(models.user, { as: 'friends', sourceKey: 'friendId', foreignKey: 'id' });
    }
  }
  friend.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        onDelete: 'CASCADE',
        references: {
          model: 'users',
          key: 'id',
          as: 'userId',
        },
      },
      friendId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        onDelete: 'CASCADE',
        references: {
          model: 'users',
          key: 'id',
          as: 'friendId',
        },
      },
    },
    {
      sequelize,
      modelName: 'friend',
    }
  );
  return friend;
};
