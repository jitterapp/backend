const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const Model = Sequelize.Model;

class Activity extends Model {}

Activity.init(
  {
    type: {
      type: Sequelize.TINYINT,
      // - Replied to jit - 1
      // - Replied to story - 2
      // - Friend request received - 3
      // - Friend request accepted - 4
      // - Friend request rejected - 5
      // - Unfriended - 6
      // - Direct Messaging - 7
    },
    description: {
      type: Sequelize.TEXT,
    },
    message: {
      type: Sequelize.TEXT,
    },
    other: {
      type: Sequelize.TEXT,
    },
  },
  {
    sequelize,
    modelName: 'activity',
  }
);

module.exports = Activity;
