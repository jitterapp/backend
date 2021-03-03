const jwt = require('jsonwebtoken');

const createToken = (user) => {
  return jwt.sign({ id: user.id }, 'this-is-our-secret', { expiresIn: '2d' });
};

const verify = (token) => {
  return jwt.verify(token, 'this-is-our-secret');
};

module.exports = { createToken, verify };
