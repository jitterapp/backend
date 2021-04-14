const db = require('../../db/models');
const sequelize = db.sequelize;
const path = require('path');
const Umzug = require('umzug');
const Sequelize = require('sequelize');

const performMigrations = async () => {
  const umzug = new Umzug({
    migrations: {
      path: path.join(__dirname, '../../db/migrations'),
      params: [sequelize.getQueryInterface(), Sequelize],
    },
    storage: 'sequelize',
    storageOptions: {
      sequelize: sequelize,
    },
  });

  await umzug.up();
  console.log('All migrations performed successfully');
};

const performSeeders = async () => {
  const umzug = new Umzug({
    migrations: {
      path: path.join(__dirname, '../../db/seeders'),
      params: [sequelize.getQueryInterface(), Sequelize],
    },
    storage: 'sequelize',
    storageOptions: {
      sequelize: sequelize,
    },
  });

  await umzug.up();
  console.log('All seeders performed successfully');
};

const performMigrationAndSeeders = async () => {
  await performMigrations();
  await performSeeders();
};

module.exports = {
  performMigrations,
  performSeeders,
  performMigrationAndSeeders,
};
