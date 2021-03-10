const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const User = require('../user/User');

const Model = Sequelize.Model;

class FriendRequest extends Model {}

FriendRequest.init(
  {
    requesterId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
    },
    requesteeId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
    },
  },
  {
    sequelize,
    modelName: 'friendRequest',
  }
);

FriendRequest.hasOne(User, { as: 'requestee', sourceKey: 'requesteeId', foreignKey: 'id' });
FriendRequest.hasOne(User, { as: 'requester', sourceKey: 'requesterId', foreignKey: 'id' });

module.exports = FriendRequest;
