/* eslint-disable no-unused-vars */
'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class jitLike extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      jitLike.belongsTo(models.user, { foreignKey: 'userId' });
    }
  }
  jitLike.init(
    {},
    {
      sequelize,
      modelName: 'jitLike',
    }
  );
  return jitLike;
};
