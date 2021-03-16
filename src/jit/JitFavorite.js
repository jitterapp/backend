const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const Model = Sequelize.Model;

class JitFavorite extends Model {}

JitFavorite.init(
  {},
  {
    sequelize,
    modelName: 'jitFavorite',
  }
);

module.exports = JitFavorite;
