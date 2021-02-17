const User = require('./User');
const bcrypt = require('bcrypt');

const save = async (body) => {
  const saltRounds = 10;
  const hash = await bcrypt.hash(body.password, saltRounds);
  const user = { ...body, password: hash };
  await User.create(user);
};

const findByEmail = async (email) => {
  const user = await User.findOne({ where: { email: email } });
  if (user) {
    throw new Error('email is already in use');
  }
};

module.exports = { save, findByEmail };
