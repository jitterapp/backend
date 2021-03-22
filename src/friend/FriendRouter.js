const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const FriendService = require('./FriendService');
const UserService = require('../user/UserService');
const pagination = require('../middleware/pagination');
const tokenAuthentication = require('../middleware/tokenAuthentication');
const validateRequest = require('../middleware/validateRequest');
const logActivity = require('../middleware/logActivity');

// friend request
router.post(
  '/api/1.0/friends/:userId',
  check('userId')
    .isInt()
    .withMessage('userId should be integer')
    .bail()
    .toInt()
    .custom(async (userId) => {
      const user = await UserService.getUser(userId);
      if (!user) {
        throw new Error('can not find user');
      }
    }),
  tokenAuthentication,
  validateRequest,
  async (req, res, next) => {
    try {
      const authenticatedUser = req.authenticatedUser;
      const userId = req.params.userId;

      if (authenticatedUser.id === userId) {
        throw new Error('can not friend yourself');
      }

      const requestSentCount = await FriendService.getRequestCount(authenticatedUser.id, userId);
      if (requestSentCount > 0) {
        throw new Error('already sent friend request');
      }

      const requestReceivedCount = await FriendService.getRequestCount(userId, authenticatedUser.id);
      if (requestReceivedCount > 0) {
        throw new Error('already received friend request');
      }

      const friendCount = await FriendService.getFriendCount(authenticatedUser.id, userId);
      if (friendCount > 0) {
        throw new Error('already friend');
      }

      const result = await FriendService.friendRequest(authenticatedUser.id, userId);
      res.result = result;
      return next();
    } catch (err) {
      next(err);
    }
  },
  logActivity(3)
);

// accept friend request
router.put(
  '/api/1.0/friends/:requesterId',
  check('requesterId').isInt().withMessage('requesterId should be integer').bail().toInt(),
  tokenAuthentication,
  validateRequest,
  async (req, res, next) => {
    try {
      const authenticatedUser = req.authenticatedUser;
      const requesterId = req.params.requesterId;
      const requestReceivedCount = await FriendService.getRequestCount(requesterId, authenticatedUser.id);
      if (requestReceivedCount === 0) {
        throw new Error('can not find friend request');
      }
      const result = await FriendService.acceptFriend(requesterId, authenticatedUser.id);
      await FriendService.rejectFriendRequest(authenticatedUser.id, requesterId);
      res.result = result;
      return next();
    } catch (err) {
      next(err);
    }
  },
  logActivity(4)
);

// remove friend
router.delete(
  '/api/1.0/friends/:friendId',
  check('friendId').isInt().withMessage('friendId should be integer').bail().toInt(),
  tokenAuthentication,
  validateRequest,
  async (req, res, next) => {
    try {
      const authenticatedUser = req.authenticatedUser;
      const userId = authenticatedUser.id;
      const friendId = req.params.friendId;
      const count = await FriendService.getFriendCount(userId, friendId);
      if (count === 0) {
        throw new Error('can not find friend');
      }
      const result = await FriendService.cancelFriend(userId, friendId);

      if (result) {
        res.result = { message: 'canceled friend' };
        return next();
      } else {
        throw new Error('failed to cancel friend request');
      }
    } catch (err) {
      next(err);
    }
  },
  logActivity(6)
);

// reject friend request
router.delete(
  '/api/1.0/friends/requests/received/:requesterId',
  check('requesterId').isInt().withMessage('requesterId should be integer').bail().toInt(),
  tokenAuthentication,
  validateRequest,
  async (req, res, next) => {
    try {
      const requesterId = req.params.requesterId;
      const authenticatedUser = req.authenticatedUser;
      const result = await FriendService.rejectFriendRequest(authenticatedUser.id, requesterId);
      if (result) {
        res.result = { message: 'rejected friend request' };
        return next();
      } else {
        throw new Error('failed to reject friend request');
      }
    } catch (err) {
      next(err);
    }
  },
  logActivity(5)
);

// cancel friend request
router.delete(
  '/api/1.0/friends/requests/sent/:requesteeId',
  check('requesteeId').isInt().withMessage('requesteeId should be integer').bail().toInt(),
  tokenAuthentication,
  validateRequest,
  async (req, res, next) => {
    try {
      const requesteeId = req.params.requesteeId;
      const authenticatedUser = req.authenticatedUser;
      const result = await FriendService.cancelFriendRequest(authenticatedUser.id, requesteeId);
      if (result) {
        return res.status(200).send({ message: 'canceled friend request' });
      } else {
        throw new Error('failed to cancel friend request');
      }
    } catch (err) {
      next(err);
    }
  }
);

// get friends
router.get('/api/1.0/friends', pagination, tokenAuthentication, async (req, res, next) => {
  try {
    const { page, size } = req.pagination;
    const authenticatedUser = req.authenticatedUser;
    const search = req.query.search;
    const result = await FriendService.getFriends(authenticatedUser.id, page, size, search);
    return res.send(result);
  } catch (err) {
    next(err);
  }
});

// get friend requests sent
router.get('/api/1.0/friends/requests/sent', pagination, tokenAuthentication, async (req, res, next) => {
  try {
    const { page, size } = req.pagination;
    const authenticatedUser = req.authenticatedUser;
    const result = await FriendService.getFriendRequestsSent(authenticatedUser.id, page, size);
    return res.send(result);
  } catch (err) {
    next(err);
  }
});

// get friend requests received
router.get('/api/1.0/friends/requests/received', pagination, tokenAuthentication, async (req, res, next) => {
  try {
    const { page, size } = req.pagination;
    const authenticatedUser = req.authenticatedUser;
    const result = await FriendService.getFriendRequestsReceived(authenticatedUser.id, page, size);
    return res.send(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
