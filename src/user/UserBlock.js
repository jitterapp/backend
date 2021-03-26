const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const Model = Sequelize.Model;

class UserBlock extends Model {}

UserBlock.init(
  {},
  {
    sequelize,
    modelName: 'userBlock',
  }
);

module.exports = UserBlock;
