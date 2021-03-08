const Sequelize = require('sequelize');
const config = require('config');

const dbConfig = config.get('database');

const { host, password, database, username, dialect, logging } = dbConfig;

const sequelize = new Sequelize(database, username, password, {
  host,
  dialect,
  logging,
});

module.exports = sequelize;
