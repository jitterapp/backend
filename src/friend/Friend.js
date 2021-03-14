const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const User = require('../user/User');

const Model = Sequelize.Model;

class Friend extends Model {}

Friend.init(
  {
    userId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
    },
    friendId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
    },
  },
  {
    sequelize,
    modelName: 'friend',
  }
);

Friend.hasOne(User, { as: 'friends', sourceKey: 'friendId', foreignKey: 'id' });

module.exports = Friend;
