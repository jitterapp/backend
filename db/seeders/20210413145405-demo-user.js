/* eslint-disable no-unused-vars */
'use strict';
const bcryt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */
    const hash = await bcryt.hash('Password123', 10);
    return queryInterface.bulkInsert('users', [
      {
        fullName: 'Demo User',
        userName: 'demouser',
        email: 'test@jitter.com',
        password: hash,
        inactive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
