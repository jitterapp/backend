const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const FriendService = require('./FriendService');
const tokenAuthentication = require('../middleware/tokenAuthentication');
const validateRequest = require('../middleware/validateRequest');

router.post(
  '/api/1.0/friend',
  check('friendId').notEmpty().withMessage('friendId cannot be null'),
  tokenAuthentication,
  validateRequest,
  async (req, res, next) => {
    const authenticatedUser = req.authenticatedUser;
    const { friendId } = req.body;

    try {
      const result = await FriendService.friendRequest(authenticatedUser.id, friendId);
      return res.send(result);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
