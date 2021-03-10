const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const Token = require('../auth/Token');

const Model = Sequelize.Model;

class User extends Model {}

User.init(
  {
    fullname: {
      type: Sequelize.STRING,
    },
    username: {
      type: Sequelize.STRING,
    },
    dob: {
      type: Sequelize.DATE,
    },
    email: {
      type: Sequelize.STRING,
      unique: true,
    },
    password: {
      type: Sequelize.STRING,
    },
    inactive: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },
    activationToken: {
      type: Sequelize.STRING,
    },
    isFriend: {
      type: Sequelize.VIRTUAL,
      get() {
        return !!(this.Friends && this.Friends.length);
      },
    },
    isFriendRequestSent: {
      type: Sequelize.VIRTUAL,
      get() {
        return !!(this.Requesters && this.Requesters.length);
      },
    },
    isFriendRequestReceived: {
      type: Sequelize.VIRTUAL,
      get() {
        return !!(this.Requestees && this.Requestees.length);
      },
    },
  },
  {
    sequelize,
    modelName: 'user',
  }
);
User.belongsToMany(User, {
  as: 'Friends',
  through: 'friends',
  otherKey: 'friendId',
});
User.belongsToMany(User, {
  as: 'Requestees',
  through: 'friendRequests',
  foreignKey: 'requesterId',
  onDelete: 'CASCADE',
});
User.belongsToMany(User, {
  as: 'Requesters',
  through: 'friendRequests',
  foreignKey: 'requesteeId',
  onDelete: 'CASCADE',
});

User.hasMany(Token, { onDelete: 'cascade', foreignKey: 'userId' });

module.exports = User;
