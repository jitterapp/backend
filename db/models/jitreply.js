/* eslint-disable no-unused-vars */
'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class jitReply extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      jitReply.belongsTo(models.user, { as: 'replier', foreignKey: 'userId' });
    }
  }
  jitReply.init(
    {
      content: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: 'jitReply',
    }
  );
  return jitReply;
};
