const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const Model = Sequelize.Model;

class JitReply extends Model {}

JitReply.init(
  {
    content: {
      type: Sequelize.TEXT,
    },
  },
  {
    sequelize,
    modelName: 'jitReply',
  }
);

module.exports = JitReply;
