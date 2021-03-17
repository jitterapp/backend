const express = require('express');
const UserService = require('./UserService');
const router = express.Router();
const bcrypt = require('bcrypt');
const PhoneNumberHelper = require('awesome-phonenumber');
const { check, body } = require('express-validator');
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
  check('dob').notEmpty().withMessage('Date of birth can not be null').bail().isDate(),
  check('gender').if(body('gender').exists()).notEmpty().withMessage('Gender is required').bail().isInt(),
  check('phonenumber')
    .if(body('phonenumber').exists())
    .notEmpty()
    .withMessage('Phonenumber is required')
    .bail()
    .custom(async (phonenumber) => {
      const pn = new PhoneNumberHelper(phonenumber, 'US');
      if (!pn.isValid() || !pn.isPossible()) {
        throw new Error('phonenumber is invalid');
      }
      const user = await UserService.findByPhonenumber(pn.getNumber('significant'));
      if (user) {
        throw new Error('phonenumber is already in use');
      }
    })
    .customSanitizer((phonenumber) => {
      const pn = new PhoneNumberHelper(phonenumber, 'US');
      return pn.getNumber('significant');
    })
    .bail(),
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
  const search = req.query.search;

  const users = await UserService.getUsers(page, size, authenticatedUser, search);
  res.send(users);
});

router.post(
  '/api/1.0/users/findByPhonenumbers',
  check('phonenumbers')
    .notEmpty()
    .withMessage('phonenumbers are required')
    .bail()
    .isArray()
    .withMessage('phonenumbers should be array')
    .bail()
    .custom((phonenumbers) => {
      if (!phonenumbers.length) {
        throw new Error('At least 1 phonenumber is required');
      }
      return true;
    })
    .customSanitizer((phonenumbers) => {
      return phonenumbers.map((phonenumber) => {
        const pn = new PhoneNumberHelper(phonenumber, 'US');
        return pn.getNumber('significant');
      });
    })
    .bail(),
  tokenAuthOrNot,
  validateRequest,
  async (req, res, next) => {
    try {
      const authenticatedUser = req.authenticatedUser;
      const phonenumbers = req.body.phonenumbers;
      const users = await UserService.findByPhoneNumbers(authenticatedUser, phonenumbers);
      res.send(users);
    } catch (err) {
      next(err);
    }
  }
);

router.get('/api/1.0/users/me', tokenAuthentication, async (req, res, next) => {
  try {
    const authenticatedUser = req.authenticatedUser;
    const user = await UserService.getUser(authenticatedUser.id);
    res.send(user);
  } catch (err) {
    next(err);
  }
});

router.get(
  '/api/1.0/users/:id',
  check('id').isInt().withMessage('id should be integer').bail().toInt(),
  tokenAuthOrNot,
  async (req, res, next) => {
    try {
      const authenticatedUser = req.authenticatedUser;
      const user = await UserService.getUser(req.params.id, authenticatedUser);
      res.send(user);
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/api/1.0/users/password',
  check('oldPassword').notEmpty().withMessage('Old Password cannot be null'),
  check('newPassword')
    .notEmpty()
    .withMessage('New Password cannot be null')
    .bail()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .bail()
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .withMessage('New Password must have at least one lowercase letter, one uppercase, and 1 number'),
  tokenAuthentication,
  validateRequest,
  async (req, res, next) => {
    try {
      const authenticatedUser = req.authenticatedUser;
      const user = await UserService.getUser(authenticatedUser.id, authenticatedUser, true);
      const newPassword = req.body.newPassword;
      const oldPassword = req.body.oldPassword;
      const match = await bcrypt.compare(oldPassword, user.password);
      if (!match) {
        throw new Error('Old password is incorrect');
      }
      await UserService.updatePassword(authenticatedUser.id, newPassword);
      return res.send({ message: 'Password updated' });
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/api/1.0/users/:id',
  check('id').isInt().withMessage('id should be integer').bail().toInt(),
  check('username')
    .if(body('username').exists())
    .notEmpty()
    .withMessage('Username cannot be null')
    .bail()
    .isLength({ min: 4, max: 32 })
    .withMessage('Must have min 4 and max 32 characters'),
  check('fullname')
    .if(body('fullname').exists())
    .notEmpty()
    .withMessage('Fullname cannot be null')
    .bail()
    .isLength({ min: 4, max: 32 })
    .withMessage('Must have min 4 and max 32 characters'),
  check('dob').if(body('dob').exists()).isDate(),
  check('gender').if(body('gender').exists()).notEmpty().withMessage('Gender is required').bail().isInt(),
  check('phonenumber')
    .if(body('phonenumber').exists())
    .notEmpty()
    .withMessage('Phonenumber is required')
    .bail()
    .custom(async (phonenumber) => {
      try {
        const pn = new PhoneNumberHelper(phonenumber, 'US');
        if (!pn.isValid() || !pn.isPossible()) {
          throw new Error('phonenumber is invalid');
        }
        const user = await UserService.findByPhonenumber(pn.getNumber('significant'));
        if (user) {
          throw new Error('phonenumber is already in use');
        }
      } catch (err) {
        throw new Error('phonenumber is invalid');
      }
    })
    .customSanitizer((phonenumber) => {
      const pn = new PhoneNumberHelper(phonenumber, 'US');
      return pn.getNumber('significant');
    }),
  tokenAuthentication,
  validateRequest,
  async (req, res, next) => {
    const authenticatedUser = req.authenticatedUser;

    if (authenticatedUser.id !== req.params.id) {
      return next(new ForbiddenException('Not authorized to edit user'));
    }
    if (req.body.phonenumber) {
      const user = await UserService.findByPhonenumber(req.body.phonenumber);
      if (user.id !== authenticatedUser.id) {
        throw new Error('phonenumber is already in use');
      }
    }
    await UserService.updateUser(req.params.id, req.body);
    return res.send({ message: 'updated' });
  }
);

router.delete(
  '/api/1.0/users/:id',
  check('id').isInt().withMessage('id should be integer').bail().toInt(),
  validateRequest,
  tokenAuthentication,
  async (req, res, next) => {
    const authenticatedUser = req.authenticatedUser;
    if (authenticatedUser.id !== req.params.id) {
      return next(new ForbiddenException('Not authorized to delete user'));
    }
    await UserService.deleteUser(req.params.id);
    return res.send();
  }
);

router.post(
  '/api/1.0/users/block/:userId',
  check('id').isInt().withMessage('userId should be integer').bail().toInt(),
  validateRequest,
  tokenAuthentication,
  async (req, res) => {
    try {
      const userId = req.params.userId;
      const authenticatedUser = req.authenticatedUser;
      if (authenticatedUser.id === userId) {
        throw new Error('can not block yourself');
      }
      const user = await UserService.getUser(userId);
      if (!user) {
        throw new Error('can not find user');
      }
      const isBlocked = await isBlocked(authenticatedUser.id, userId);
      if (isBlocked) {
        throw new Error('already blocked');
      }
      await UserService.blockUser(authenticatedUser.id, userId);
      return res.send(user);
    } catch (err) {
      throw new Error(err);
    }
  }
);

router.delete(
  '/api/1.0/users/block/:userId',
  check('id').isInt().withMessage('userId should be integer').bail().toInt(),
  validateRequest,
  tokenAuthentication,
  async (req, res) => {
    try {
      const userId = req.params.userId;
      const authenticatedUser = req.authenticatedUser;
      const isBlocked = await isBlocked(authenticatedUser.id, userId);
      if (!isBlocked) {
        throw new Error('not blocked');
      }
      await UserService.unblockUser(authenticatedUser.id, userId);
      const user = await UserService.getUser(userId);
      return res.send(user);
    } catch (err) {
      throw new Error(err);
    }
  }
);

module.exports = router;
