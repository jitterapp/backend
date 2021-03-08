const express = require('express');
const UserService = require('./UserService');
const router = express.Router();
const { check } = require('express-validator');
const pagination = require('../middleware/pagination');
const validateRequest = require('../middleware/validateRequest');
const ForbiddenException = require('../error/ForbiddenException');
const tokenAuthentication = require('../middleware/tokenAuthentication');
const tokenAuthOrNot = require('../middleware/tokenAuthOrNot');

router.post(
  '/api/1.0/users',
  check('username')
    .notEmpty()
    .withMessage('Username cannot be null')
    .bail()
    .isLength({ min: 4, max: 32 })
    .withMessage('Must have min 4 and max 32 characters'),
  check('fullname')
    .notEmpty()
    .withMessage('Fullname cannot be null')
    .bail()
    .isLength({ min: 4, max: 32 })
    .withMessage('Must have min 4 and max 32 characters'),
  check('dob').isDate(),
  check('email')
    .notEmpty()
    .withMessage('Email cannot be null')
    .bail()
    .isEmail()
    .withMessage('Email is not valid')
    .bail()
    .custom(async (email) => {
      const user = await UserService.findByEmail(email);
      if (user) {
        throw new Error('email is already in use');
      }
    }),
  check('password')
    .notEmpty()
    .withMessage('Password cannot be null')
    .bail()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .bail()
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .withMessage('Password must have at least one lowercase letter, one uppercase, and 1 number'),
  validateRequest,
  async (req, res, next) => {
    try {
      await UserService.save(req.body);
      return res.send({ message: 'User created' });
    } catch (err) {
      next(err);
    }
  }
);

router.get('/api/1.0/users/token/:token', async (req, res, next) => {
  const token = req.params.token;

  try {
    await UserService.activate(token);
    return res.send({ message: 'account activation success' });
  } catch (err) {
    next(err);
  }
});

router.get('/api/1.0/users', pagination, tokenAuthOrNot, async (req, res) => {
  const authenticatedUser = req.authenticatedUser;
  const { page, size } = req.pagination;

  const users = await UserService.getUsers(page, size, authenticatedUser);
  res.send(users);
});

router.get('/api/1.0/users/:id', async (req, res, next) => {
  try {
    const user = await UserService.getUser(req.params.id);
    res.send(user);
  } catch (err) {
    next(err);
  }
});

router.put('/api/1.0/users/:id', tokenAuthentication, async (req, res, next) => {
  const authenticatedUser = req.authenticatedUser;

  if (authenticatedUser.id !== Number(req.params.id)) {
    return next(new ForbiddenException('Not authorized to edit user'));
  }
  await UserService.updateUser(req.params.id, req.body);
  return res.send();
});

router.delete('/api/1.0/users/:id', tokenAuthentication, async (req, res, next) => {
  const authenticatedUser = req.authenticatedUser;
  if (authenticatedUser.id !== Number(req.params.id)) {
    return next(new ForbiddenException('Not authorized to delete user'));
  }
  await UserService.deleteUser(req.params.id);
  return res.send();
});

module.exports = router;
