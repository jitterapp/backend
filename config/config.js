require('dotenv').config();
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
} = process.env;

module.exports = {
  development: {
    username: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    host: DB_HOST,
    dialect: DB_DIALECT,
    logging: false,
  },
  test: {
    username: TEST_DB_USER,
    password: TEST_DB_PASS,
    database: TEST_DB_NAME,
    host: TEST_DB_HOST,
    dialect: TEST_DB_DIALECT,
    logging: false,
  },
  production: {
    username: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    host: DB_HOST,
    dialect: DB_DIALECT,
    logging: false,
  },
};
