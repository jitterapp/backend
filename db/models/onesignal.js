/* eslint-disable no-unused-vars */
'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class oneSignal extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      oneSignal.belongsTo(models.user, { as: 'user', foreignKey: 'userId' });
    }
  }
  oneSignal.init(
    {
      onesignalUserId: DataTypes.STRING,
      unique: true,
    },
    {
      sequelize,
      modelName: 'oneSignal',
    }
  );
  return oneSignal;
};
