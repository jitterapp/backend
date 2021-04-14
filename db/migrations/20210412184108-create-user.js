/* eslint-disable no-unused-vars */
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
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
      public: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      complete: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      blockAnonymous: {
        type: Sequelize.BOOLEAN,
        default: false,
      },
      activationToken: {
        type: Sequelize.STRING,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  },
};
