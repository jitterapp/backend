const Sequelize = require('sequelize');

const {
  DB_HOST,
  DB_PASS,
  DB_NAME,
  DB_USER,
  DB_DIALECT,
  TEST_DB_HOST,
  TEST_DB_PASS,
  TEST_DB_NAME,
  TEST_DB_USER,
  TEST_DB_DIALECT,
  NODE_ENV,
} = process.env;

let dbHost, dbPass, dbName, dbUser, dbDialect;
if (NODE_ENV === 'test') {
  dbHost = TEST_DB_HOST;
  dbPass = TEST_DB_PASS;
  dbName = TEST_DB_NAME;
  dbUser = TEST_DB_USER;
  dbDialect = TEST_DB_DIALECT;
} else {
  dbHost = DB_HOST;
  dbPass = DB_PASS;
  dbName = DB_NAME;
  dbUser = DB_USER;
  dbDialect = DB_DIALECT;
}

const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
  dialect: dbDialect,
  logging: false,
});

module.exports = sequelize;
