const express = require('express');
const router = express.Router();
const { check, body } = require('express-validator');
const pagination = require('../middleware/pagination');
const tokenAuthentication = require('../middleware/tokenAuthentication');
const validateRequest = require('../middleware/validateRequest');
const ActivityService = require('./ActivityService');
const UserService = require('../user/UserService');
const StoryService = require('../story/StoryService');
const JitService = require('../jit/JitService');

router.get('/api/1.0/activities', pagination, tokenAuthentication, async (req, res, next) => {
  try {
    const { page, size } = req.pagination;
    const authenticatedUser = req.authenticatedUser;
    const result = await ActivityService.getActivities(authenticatedUser.id, page, size);
    return res.send(result);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/api/1.0/activities',
  check('userId').notEmpty().isInt().withMessage('userId should be integer').bail().toInt(),
  check('type').notEmpty().isInt().withMessage('type should be integer').bail().toInt(),
  check('referenceId')
    .if(body('referenceId').exists())
    .isInt()
    .withMessage('referenceId should be integer')
    .bail()
    .toInt(),
  tokenAuthentication,
  validateRequest,
  async (req, res, next) => {
    try {
      const { type, message, userId, referenceId } = req.body; // referenceId: sotry or jit id
      const authenticatedUser = req.authenticatedUser;
      if (authenticatedUser.id === userId) {
        throw new Error('can not log activity to yrself');
      }
      const user = await UserService.getUser(userId);
      if (!user) {
        throw new Error('can not find user');
      }

      if ((type === 1 || type === 2) && !referenceId) {
        throw new Error('referenceId is required');
      }
      let description = '';
      // - Replied to jit - 1
      // - Replied to story - 2
      // - Direct Messaging - 7
      if (type === 1) {
        description = 'replied to jit';
        const jit = await JitService.findJitById(referenceId);
        if (!jit) {
          throw new Error('can not find jit');
        }
      } else if (type === 2) {
        description = 'replied to story';
        const story = await StoryService.findStoryById(referenceId);
        if (!story) {
          throw new Error('can not find story');
        }
      } else if (type === 7) {
        description = 'sent you a message';
        if (!message) {
          throw new Error('message is required');
        }
      } else {
        throw new Error('type should be 1, 2 or 7');
      }

      const activity = await ActivityService.logActivity(
        type,
        userId,
        authenticatedUser.id,
        description,
        message,
        referenceId
      );
      return res.send(activity);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
