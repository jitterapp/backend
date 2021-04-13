/* eslint-disable no-unused-vars */
'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class userImage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      userImage.belongsTo(models.user, {
        foreignKey: 'userId',
        onDelete: 'CASCADE',
      });
    }
  }
  userImage.init(
    {
      image: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'userImage',
    }
  );
  return userImage;
};
