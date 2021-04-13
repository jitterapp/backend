/* eslint-disable no-unused-vars */
'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class user extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      user.hasMany(models.userImage, {
        foreignKey: 'userId',
        onDelete: 'CASCADE',
      });
      user.belongsToMany(models.user, {
        as: 'Friends',
        through: 'friends',
        otherKey: 'friendId',
      });
      user.belongsToMany(models.user, {
        as: 'Requestees',
        through: 'friendRequests',
        foreignKey: 'requesterId',
        onDelete: 'CASCADE',
      });
      user.belongsToMany(models.user, {
        as: 'Requesters',
        through: 'friendRequests',
        foreignKey: 'requesteeId',
        onDelete: 'CASCADE',
      });
      user.hasMany(models.userBlock, {
        foreignKey: 'userId',
        onDelete: 'CASCADE',
      });
      user.hasMany(models.token, {
        foreignKey: 'userId',
        onDelete: 'CASCADE',
      });
      user.hasMany(models.jit, {
        foreignKey: 'userId',
        onDelete: 'CASCADE',
      });
      user.hasMany(models.jitReply, {
        foreignKey: 'userId',
        onDelete: 'CASCADE',
      });
      user.hasMany(models.jitLike, {
        foreignKey: 'userId',
        onDelete: 'CASCADE',
      });
      user.hasMany(models.jitFavorite, {
        foreignKey: 'userId',
        onDelete: 'CASCADE',
      });
      user.hasMany(models.story, {
        foreignKey: 'userId',
        onDelete: 'CASCADE',
      });
      user.hasMany(models.oneSignal, {
        onDelete: 'cascade',
        foreignKey: 'userId',
      });
      user.hasMany(models.activity, {
        onDelete: 'cascade',
        foreignKey: 'userId',
      });
    }
  }
  user.init(
    {
      fullname: {
        type: DataTypes.STRING,
      },
      username: {
        type: DataTypes.STRING,
      },
      dob: {
        type: DataTypes.DATE,
      },
      image: {
        type: DataTypes.STRING,
      },
      phonenumber: {
        type: DataTypes.STRING,
        unique: true,
      },
      gender: {
        type: DataTypes.TINYINT,
        defaultValue: 3,
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
      },
      inactive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      public: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      complete: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      blockAnonymous: {
        type: DataTypes.BOOLEAN,
        default: false,
      },
      activationToken: {
        type: DataTypes.STRING,
      },
      isFriend: {
        type: DataTypes.VIRTUAL,
        get() {
          return !!(this.Friends && this.Friends.length);
        },
      },
      isFriendRequestSent: {
        type: DataTypes.VIRTUAL,
        get() {
          return !!(this.Requesters && this.Requesters.length);
        },
      },
      isFriendRequestReceived: {
        type: DataTypes.VIRTUAL,
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
  return user;
};
