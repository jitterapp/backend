const User = require('./User');
const bcrypt = require('bcrypt');
const EmailService = require('../email/EmailService');
const sequelize = require('../config/database');
const Sequelize = require('sequelize');
const EmailException = require('../email/EmailException');
const InvalidTokenException = require('./InvalidTokenException');
const UserNotFoundException = require('./UserNotFoundException');
const { randomString } = require('../shared/generator');

const save = async (body) => {
  const { fullname, username, email, password, dob } = body;
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  const user = { fullname, username, email, dob, password: hash, activationToken: randomString(16) };
  const transaction = await sequelize.transaction();
  await User.create(user, { transaction });
  try {
    await EmailService.sendAccountActivation(email, user.activationToken);
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw new EmailException();
  }
};

const findByEmail = async (email) => {
  return await User.findOne({ where: { email: email } });
};

const activate = async (token) => {
  const user = await User.findOne({ where: { activationToken: token } });
  if (!user) {
    throw new InvalidTokenException();
  }
  user.inactive = false;
  user.activationToken = null;
  await user.save();
};

const getUsers = async (page, size, authenticatedUser) => {
  const usersWithCount = await User.findAndCountAll({
    where: { inactive: false, id: { [Sequelize.Op.not]: authenticatedUser ? authenticatedUser.id : 0 } },
    attributes: ['id', 'username', 'fullname', 'email', 'dob'],
    limit: size,
    offset: size * page,
  });
  return {
    content: usersWithCount.rows,
    page,
    size,
    totalPages: Math.ceil(usersWithCount.count / size),
  };
};

const getUser = async (id, includePassword = false) => {
  const attributes = ['id', 'username', 'email', 'fullname', 'dob'];
  if (includePassword) {
    attributes.push('password');
  }
  const user = await User.findOne({
    where: { id: id, inactive: false },
    attributes,
  });
  if (!user) {
    throw new UserNotFoundException();
  }
  return user;
};

const updateUser = async (id, updateBody) => {
  const user = await User.findOne({ where: { id: id } });
  user.username = updateBody.username || user.username;
  user.dob = updateBody.dob || user.dob;
  user.fullname = updateBody.fullname || user.fullname;
  await user.save();
};

const deleteUser = async (id) => {
  await User.destroy({ where: { id: id } });
};

const updatePassword = async (id, password) => {
  const user = await User.findOne({ where: { id: id } });
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  user.password = hash;
  await user.save();
};

module.exports = { save, findByEmail, activate, getUsers, getUser, updateUser, deleteUser, updatePassword };
