const express = require('express');
const router = express.Router();
const UserService = require('../user/UserService');
const validateRequest = require('../middleware/validateRequest');
const AuthenticationException = require('./AuthenticationException');
const bcrypt = require('bcrypt');
const ForbiddenException = require('../error/ForbiddenException');
const { check } = require('express-validator');
const TokenService = require('./TokenService');

router.post(
  '/api/1.0/auth',
  check('email').notEmpty().withMessage('Email cannot be null').bail().isEmail().withMessage('Email is not valid'),
  check('password').notEmpty().withMessage('Password cannot be null'),
  validateRequest,
  async (req, res, next) => {
    const { email, password } = req.body;
    const user = await UserService.findByEmail(email);
    if (!user) {
      return next(new AuthenticationException());
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return next(new AuthenticationException());
    }
    if (user.inactive) {
      return next(new ForbiddenException());
    }

    const token = await TokenService.createToken(user);

    res.send({
      id: user.id,
      username: user.username,
      token,
    });
  }
);

router.post('/api/1.0/logout', async (req, res) => {
  const authorization = req.headers.authorization;
  if (authorization) {
    const token = authorization.substring(7);
    await TokenService.deleteToken(token);
  }
  res.send();
});

module.exports = router;
