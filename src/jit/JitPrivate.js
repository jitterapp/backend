const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const Model = Sequelize.Model;

class JitPrivate extends Model {}

JitPrivate.init(
  {},
  {
    sequelize,
    modelName: 'jitPrivate',
  }
);

module.exports = JitPrivate;
