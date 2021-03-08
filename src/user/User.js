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
  },
  {
    sequelize,
    modelName: 'user',
  }
);

User.hasMany(Token, { onDelete: 'cascade', foreignKey: 'userId' });

module.exports = User;
