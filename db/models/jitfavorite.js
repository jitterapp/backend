/* eslint-disable no-unused-vars */
'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class jitFavorite extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      jitFavorite.belongsTo(models.user, { foreignKey: 'userId' });
    }
  }
  jitFavorite.init(
    {},
    {
      sequelize,
      modelName: 'jitFavorite',
    }
  );
  return jitFavorite;
};
