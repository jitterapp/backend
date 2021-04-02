const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const Model = Sequelize.Model;

class OneSignal extends Model {}

OneSignal.init(
  {
    onesignalUserId: {
      type: Sequelize.STRING,
      unique: true,
    },
  },
  {
    sequelize,
    modelName: 'onesignal',
  }
);

module.exports = OneSignal;
