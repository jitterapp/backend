const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const Model = Sequelize.Model;

class Story extends Model {}

Story.init(
  {
    resource: {
      type: Sequelize.STRING,
    },
  },
  {
    sequelize,
    modelName: 'story',
  }
);

module.exports = Story;
