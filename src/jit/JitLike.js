const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const Model = Sequelize.Model;

class JitLike extends Model {}

JitLike.init(
  {},
  {
    sequelize,
    modelName: 'jitLike',
  }
);

module.exports = JitLike;
