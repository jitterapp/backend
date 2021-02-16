const User = require('./User');
const bcrypt = require('bcrypt');

const save = async (body) => {
  const saltRounds = 10;
  const hash = await bcrypt.hash(body.password, saltRounds);
  const user = { ...body, password: hash };
  await User.create(user);
};

module.exports = { save };
