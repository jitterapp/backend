const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const JitReply = require('./JitReply');
const JitFavorite = require('./JitFavorite');
const JitLike = require('./JitLike');
const JitPrivate = require('./JitPrivate');

const Model = Sequelize.Model;

class Jit extends Model {}

Jit.init(
  {
    content: {
      type: Sequelize.TEXT,
    },
    ispublic: {
      type: Sequelize.BOOLEAN,
      defaultValue: 1,
    },
    anonymous: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'jit',
  }
);

Jit.hasMany(JitReply, { onDelete: 'cascade', foreignKey: 'jitId' });
Jit.hasMany(JitFavorite, { onDelete: 'cascade', foreignKey: 'jitId' });
Jit.hasMany(JitLike, { onDelete: 'cascade', foreignKey: 'jitId' });
Jit.hasMany(JitPrivate, { onDelete: 'cascade', foreignKey: 'jitId' });
JitReply.belongsTo(Jit, { foreignKey: 'jitId' });
JitFavorite.belongsTo(Jit, { foreignKey: 'jitId' });
JitLike.belongsTo(Jit, { foreignKey: 'jitId' });
JitPrivate.belongsTo(Jit, { foreignKey: 'jitId' });

module.exports = Jit;
