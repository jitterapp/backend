const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const tokenAuthentication = require('../middleware/tokenAuthentication');
const validateRequest = require('../middleware/validateRequest');
const OnesignalService = require('./OneSignalService');

router.post(
  '/api/1.0/onesignal',
  check('onesignalUserId').notEmpty().withMessage('cannot be null').bail(),
  tokenAuthentication,
  validateRequest,
  async (req, res, next) => {
    try {
      const authenticatedUser = req.authenticatedUser;
      const userId = authenticatedUser.id;
      const { onesignalUserId } = req.body;
      const existing = await OnesignalService.findOnesignalUserId(userId, onesignalUserId);
      if (existing) {
        throw new Error('already registered');
      }
      const result = await OnesignalService.registerOneSignalUserId(userId, onesignalUserId);
      res.send(result);
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/api/1.0/onesignal',
  check('onesignalUserId').notEmpty().withMessage('cannot be null').bail(),
  tokenAuthentication,
  validateRequest,
  async (req, res, next) => {
    try {
      const authenticatedUser = req.authenticatedUser;
      const userId = authenticatedUser.id;
      const { onesignalUserId } = req.body;
      await OnesignalService.removeByUserIdAndOneSignalUserId(userId, onesignalUserId);
      res.send({ message: 'removed' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
