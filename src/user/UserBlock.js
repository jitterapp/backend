const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const Model = Sequelize.Model;

class UserBlock extends Model {}

UserBlock.init(
  {},
  {
    sequelize,
    modelName: 'userblock',
  }
);

module.exports = UserBlock;
