const Sequelize = require('sequelize');
const sequelize = require('../config/database');

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

module.exports = User;
