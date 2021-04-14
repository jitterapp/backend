/* eslint-disable no-unused-vars */
'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class activity extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      activity.belongsTo(models.user, {
        as: 'user',
        foreignKey: 'fromUserId',
      });
    }
  }
  activity.init(
    {
      type: {
        type: DataTypes.TINYINT,
        // - Replied to jit - 1
        // - Replied to story - 2
        // - Friend request received - 3
        // - Friend request accepted - 4
        // - Friend request rejected - 5
        // - Unfriended - 6
        // - Direct Messaging - 7
      },
      description: {
        type: DataTypes.TEXT,
      },
      message: {
        type: DataTypes.TEXT,
      },
      other: {
        type: DataTypes.TEXT,
      },
    },
    {
      sequelize,
      modelName: 'activity',
    }
  );
  return activity;
};
