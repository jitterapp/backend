const Sequelize = require('sequelize');

const sequelize = new Sequelize('jitter', 'my-db-user', 'db-password', {
  dialect: 'sqlite',
  storage: './database.sqlite',
});

module.exports = sequelize;
