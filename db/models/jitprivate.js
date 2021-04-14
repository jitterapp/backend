/* eslint-disable no-unused-vars */
'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class jitPrivate extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      jitPrivate.belongsTo(models.user, { foreignKey: 'userId' });
    }
  }
  jitPrivate.init(
    {},
    {
      sequelize,
      modelName: 'jitPrivate',
    }
  );
  return jitPrivate;
};
