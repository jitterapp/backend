const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const Token = require('../auth/Token');
const Jit = require('../jit/Jit');
const JitReply = require('../jit/JitReply');
const JitFavorite = require('../jit/JitFavorite');
const JitLike = require('../jit/JitLike');
const JitPrivate = require('../jit/JitPrivate');

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
    image: {
      type: Sequelize.STRING,
    },
    phonenumber: {
      type: Sequelize.STRING,
      unique: true,
    },
    gender: {
      type: Sequelize.TINYINT,
      defaultValue: 3,
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
User.hasMany(Jit, { onDelete: 'cascade', foreignKey: 'userId' });
User.hasMany(JitReply, { onDelete: 'cascade', foreignKey: 'userId' });
User.hasMany(JitFavorite, { onDelete: 'cascade', foreignKey: 'userId' });
User.hasMany(JitLike, { onDelete: 'cascade', foreignKey: 'userId' });
User.hasMany(JitPrivate, { onDelete: 'cascade', foreignKey: 'userId' });

Jit.belongsTo(User, { as: 'creator', foreignKey: 'userId' });

JitReply.belongsTo(User, { as: 'replier', foreignKey: 'userId' });
JitFavorite.belongsTo(User, { foreignKey: 'userId' });
JitLike.belongsTo(User, { foreignKey: 'userId' });
JitPrivate.belongsTo(User, { foreignKey: 'userId' });

module.exports = User;
