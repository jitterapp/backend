const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const Model = Sequelize.Model;

class UserImage extends Model {}

UserImage.init(
  {
    image: {
      type: Sequelize.STRING,
    },
  },
  {
    sequelize,
    modelName: 'userImage',
  }
);

module.exports = UserImage;
