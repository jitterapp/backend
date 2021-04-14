/* eslint-disable no-unused-vars */
'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class friendRequest extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      friendRequest.hasOne(models.user, { as: 'requestee', sourceKey: 'requesteeId', foreignKey: 'id' });
      friendRequest.hasOne(models.user, { as: 'requester', sourceKey: 'requesterId', foreignKey: 'id' });
    }
  }
  friendRequest.init(
    {
      requesterId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
      requesteeId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
    },
    {
      sequelize,
      modelName: 'friendRequest',
    }
  );
  return friendRequest;
};
