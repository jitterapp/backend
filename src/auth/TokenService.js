const { randomString } = require('../shared/generator');
const Token = require('./Token');

const createToken = async (user) => {
  const token = randomString(32);
  await Token.create({
    token: token,
    userId: user.id,
  });
  return token;
};

const verify = async (token) => {
  const tokenInDb = await Token.findOne({ where: { token: token } });
  const userId = tokenInDb.userId;
  return { id: userId };
};

module.exports = { createToken, verify };
