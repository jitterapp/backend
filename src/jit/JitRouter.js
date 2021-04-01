const express = require('express');
const router = express.Router();
const { check, body } = require('express-validator');
const tokenAuthentication = require('../middleware/tokenAuthentication');
const pagination = require('../middleware/pagination');
const validateRequest = require('../middleware/validateRequest');
const JitService = require('./JitService');
const UserService = require('../user/UserService');

router.post(
  '/api/1.0/jits',
  check('content').notEmpty().withMessage('content is required'),
  check('friendIds')
    .if(body('friendIds').exists())
    .notEmpty()
    .withMessage('friendIds is required')
    .bail()
    .isArray()
    .withMessage('friendIds should be array')
    .bail()
    .custom(async (friendIds) => {
      if (!friendIds.length) {
        throw new Error('at least 1 friendId is required');
      }
      if (!friendIds.every((friendId) => Number.isInteger(friendId))) {
        throw new Error('friendId should be integer');
      }
    })
    .bail(),
  tokenAuthentication,
  validateRequest,
  async (req, res, next) => {
    try {
      const { friendIds, content } = req.body;
      const authenticatedUser = req.authenticatedUser;
      const userId = authenticatedUser.id;

      if (friendIds) {
        if (!friendIds.every((friendId) => friendId !== userId)) {
          throw new Error('can not jit to yrself');
        }
        for (let i = 0; i < friendIds.length; i++) {
          const friendId = friendIds[i];
          const user = await UserService.getUser(friendId);
          if (!user) {
            throw new Error('can not find user');
          }
        }
      }

      const anonymous = !!friendIds;
      const result = await JitService.postJit(userId, content, friendIds, !anonymous, anonymous);
      return res.send(result);
    } catch (err) {
      next(err);
    }
  }
);

router.get('/api/1.0/jits', pagination, tokenAuthentication, async (req, res, next) => {
  try {
    const authenticatedUser = req.authenticatedUser;
    const { page, size } = req.pagination;
    const { search } = req.query;
    const jits = await JitService.findJits(authenticatedUser, page, size, false, false, 0, search);
    res.send(jits);
  } catch (err) {
    next(err);
  }
});

router.get(
  '/api/1.0/jits/all/:userId',
  check('userId').isInt().withMessage('userId should be integer').bail().toInt(),
  pagination,
  tokenAuthentication,
  validateRequest,
  async (req, res, next) => {
    try {
      const userId = req.params.userId;
      const user = await UserService.getUser(userId);
      if (!user) {
        throw new Error('can not find user');
      }
      const authenticatedUser = req.authenticatedUser;
      const { page, size } = req.pagination;
      const { search } = req.query;
      const jits = await JitService.findJits(authenticatedUser, page, size, false, false, 0, search, userId);
      res.send(jits);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/api/1.0/jits/public/:userId',
  check('userId').isInt().withMessage('userId should be integer').bail().toInt(),
  pagination,
  tokenAuthentication,
  validateRequest,
  async (req, res, next) => {
    try {
      const userId = req.params.userId;
      const user = await UserService.getUser(userId);
      if (!user) {
        throw new Error('can not find user');
      }
      const authenticatedUser = req.authenticatedUser;
      const { page, size } = req.pagination;
      const { search } = req.query;
      const jits = await JitService.findJits(authenticatedUser, page, size, true, false, 0, search, userId);
      res.send(jits);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/api/1.0/jits/private/:userId',
  check('userId').isInt().withMessage('userId should be integer').bail().toInt(),
  pagination,
  tokenAuthentication,
  validateRequest,
  async (req, res, next) => {
    try {
      const userId = req.params.userId;
      const user = await UserService.getUser(userId);
      if (!user) {
        throw new Error('can not find user');
      }
      const authenticatedUser = req.authenticatedUser;
      const { page, size } = req.pagination;
      const { search } = req.query;
      const jits = await JitService.findJits(authenticatedUser, page, size, false, true, 0, search, userId);
      res.send(jits);
    } catch (err) {
      next(err);
    }
  }
);

router.get('/api/1.0/jits/liked', pagination, tokenAuthentication, async (req, res, next) => {
  try {
    const authenticatedUser = req.authenticatedUser;
    const { page, size } = req.pagination;
    const jits = await JitService.findJitsLiked(authenticatedUser, page, size);
    res.send(jits);
  } catch (err) {
    next(err);
  }
});

router.get('/api/1.0/jits/favorited', pagination, tokenAuthentication, async (req, res, next) => {
  try {
    const authenticatedUser = req.authenticatedUser;
    const { page, size } = req.pagination;
    const jits = await JitService.findJitsFavorited(authenticatedUser, page, size);
    res.send(jits);
  } catch (err) {
    next(err);
  }
});

router.get('/api/1.0/jits/private', pagination, tokenAuthentication, async (req, res, next) => {
  try {
    const authenticatedUser = req.authenticatedUser;
    const { page, size } = req.pagination;
    const jits = await JitService.findJits(authenticatedUser, page, size, false, true, authenticatedUser.id);
    res.send(jits);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/api/1.0/jits/reply/:jitId',
  check('jitId').isInt().withMessage('jitId should be integer').bail().toInt(),
  check('content').notEmpty().withMessage('content is required'),
  tokenAuthentication,
  validateRequest,
  async (req, res, next) => {
    try {
      const { jitId } = req.params;
      const { content } = req.body;
      const authenticatedUser = req.authenticatedUser;
      const userId = authenticatedUser.id;
      const jit = await JitService.findJitById(jitId);
      if (!jit) {
        throw new Error('can not find jit');
      }
      const result = await JitService.replyJit(userId, jitId, content);
      return res.send(result);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/api/1.0/jits/reply/:jitId',
  check('jitId').isInt().withMessage('jitId should be integer').bail().toInt(),
  pagination,
  tokenAuthentication,
  validateRequest,
  async (req, res, next) => {
    try {
      const { jitId } = req.params;
      const { page, size } = req.pagination;
      const jit = await JitService.findJitById(jitId);
      if (!jit) {
        throw new Error('can not find jit');
      }
      const result = await JitService.findRepliesByJitId(jitId, page, size);
      return res.send(result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/api/1.0/jits/like/:jitId',
  check('jitId').isInt().withMessage('jitId should be integer').bail().toInt(),
  tokenAuthentication,
  validateRequest,
  async (req, res, next) => {
    try {
      const { jitId } = req.params;
      const jit = await JitService.findJitById(jitId);
      if (!jit) {
        throw new Error('can not find jit');
      }
      const authenticatedUser = req.authenticatedUser;
      const userId = authenticatedUser.id;
      const liked = await JitService.hasJitLike(userId, jitId);
      if (liked) {
        throw new Error('already liked');
      }
      const result = await JitService.likeJit(userId, jitId);
      return res.send(result);
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/api/1.0/jits/like/:jitId',
  check('jitId').isInt().withMessage('jitId should be integer').bail().toInt(),
  tokenAuthentication,
  validateRequest,
  async (req, res, next) => {
    try {
      const { jitId } = req.params;
      const jit = await JitService.findJitById(jitId);
      if (!jit) {
        throw new Error('can not find jit');
      }
      const authenticatedUser = req.authenticatedUser;
      const userId = authenticatedUser.id;
      const liked = await JitService.hasJitLike(userId, jitId);
      if (!liked) {
        throw new Error('not liked');
      }
      const result = await JitService.unlikeJit(userId, jitId);
      return res.send(result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/api/1.0/jits/favorite/:jitId',
  check('jitId').isInt().withMessage('jitId should be integer').bail().toInt(),
  tokenAuthentication,
  validateRequest,
  async (req, res, next) => {
    try {
      const { jitId } = req.params;
      const authenticatedUser = req.authenticatedUser;
      const userId = authenticatedUser.id;
      const jit = await JitService.findJitById(jitId);
      if (!jit) {
        throw new Error('can not find jit');
      }
      const favorite = await JitService.hasJitFavorite(userId, jitId);
      if (favorite) {
        throw new Error('already marked favorite');
      }
      const result = await JitService.favoriteJit(userId, jitId);
      return res.send(result);
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/api/1.0/jits/favorite/:jitId',
  check('jitId').isInt().withMessage('jitId should be integer').bail().toInt(),
  tokenAuthentication,
  validateRequest,
  async (req, res, next) => {
    try {
      const { jitId } = req.params;
      const authenticatedUser = req.authenticatedUser;
      const userId = authenticatedUser.id;
      const jit = await JitService.findJitById(jitId);
      if (!jit) {
        throw new Error('can not find jit');
      }
      const favorite = await JitService.hasJitFavorite(userId, jitId);
      if (!favorite) {
        throw new Error('not marked favorite');
      }
      const result = await JitService.unfavoriteJit(userId, jitId);
      return res.send(result);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/api/1.0/jits/:jitId',
  check('jitId').isInt().withMessage('jitId should be integer').bail().toInt(),
  tokenAuthentication,
  validateRequest,
  async (req, res, next) => {
    try {
      const { jitId } = req.params;
      const jit = await JitService.findJitById(jitId);
      if (!jit) {
        throw new Error('can not find jit');
      }
      return res.send(jit);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
