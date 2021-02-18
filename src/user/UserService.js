const User = require('./User');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const generateToken = (length) => {
  //convert bytes to hex format
  return crypto.randomBytes(length).toString('hex').substring(0, length);
};

const save = async (body) => {
  const { username, email, password } = body;
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  const user = { username, email, password: hash, activationToken: generateToken(16) };
  await User.create(user);
};

const findByEmail = async (email) => {
  const user = await User.findOne({ where: { email: email } });
  if (user) {
    throw new Error('email is already in use');
  }
};

module.exports = { save, findByEmail };
