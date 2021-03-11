const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const FriendService = require('./FriendService');
const UserService = require('../user/UserService');
const pagination = require('../middleware/pagination');
const tokenAuthentication = require('../middleware/tokenAuthentication');
const validateRequest = require('../middleware/validateRequest');

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
    const authenticatedUser = req.authenticatedUser;
    const userId = req.params.userId;

    if (authenticatedUser.id === userId) {
      return next({ status: 400, message: 'can not friend yourself' });
    }

    const requestSentCount = await FriendService.getRequestCount(authenticatedUser.id, userId);
    if (requestSentCount > 0) {
      return next({ status: 400, message: 'already sent friend request' });
    }

    const requestReceivedCount = await FriendService.getRequestCount(userId, authenticatedUser.id);
    if (requestReceivedCount > 0) {
      return next({ status: 400, message: 'already received friend request' });
    }

    const friendCount = await FriendService.getFriendCount(authenticatedUser.id, userId);
    if (friendCount > 0) {
      return next({ status: 400, message: 'already friend' });
    }

    try {
      const result = await FriendService.friendRequest(authenticatedUser.id, userId);
      return res.send(result);
    } catch (err) {
      next(err);
    }
  }
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
        return next({ status: 400, message: 'can not find friend request' });
      }
      const result = await FriendService.acceptFriend(requesterId, authenticatedUser.id);
      await FriendService.rejectFriendRequest(authenticatedUser.id, requesterId);
      res.send(result);
    } catch (err) {
      next(err);
    }
  }
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
        return next({ status: 400, message: 'can not find friend' });
      }
      const result = await FriendService.cancelFriend(userId, friendId);

      if (result) {
        return res.status(200).send({ message: 'canceled friend' });
      } else {
        return next({ status: 400, message: 'failed to cancel friend request' });
      }
    } catch (err) {
      next(err);
    }
  }
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
        return res.status(200).send({ message: 'rejected friend request' });
      } else {
        return next({ status: 400, message: 'failed to reject friend request' });
      }
    } catch (err) {
      next(err);
    }
  }
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
        return next({ status: 400, message: 'failed to cancel friend request' });
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
