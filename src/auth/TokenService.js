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

const deleteToken = async (token) => {
  await Token.destroy({ where: { token: token } });
};

module.exports = { createToken, verify, deleteToken };
