const express = require('express');
const router = express.Router();
const multer = require('multer');
const { check } = require('express-validator');
const tokenAuthentication = require('../middleware/tokenAuthentication');
const pagination = require('../middleware/pagination');
const validateRequest = require('../middleware/validateRequest');
const StoryService = require('./StoryService');

const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

router.get('/api/1.0/stories', pagination, tokenAuthentication, async (req, res, next) => {
  try {
    const { page, size } = req.pagination;
    const { search } = req.query;
    const stories = await StoryService.findStories(page, size, search);
    res.send(stories);
  } catch (err) {
    next(err);
  }
});

router.get(
  '/api/1.0/stories/:storyId',
  check('storyId').isInt().withMessage('storyId should be integer').bail().toInt(),
  tokenAuthentication,
  validateRequest,
  async (req, res, next) => {
    try {
      const { storyId } = req.params;
      const story = await StoryService.findStoryById(storyId);
      if (!story) {
        throw new Error('can not find story');
      }
      return res.send(story);
    } catch (err) {
      next(err);
    }
  }
);

router.post('/api/1.0/stories', tokenAuthentication, async (req, res, next) => {
  try {
    const uploadHandler = upload.single('resource');
    uploadHandler(req, res, (err) => {
      if (err) {
        return res.status(400).send({ path: req.originalUrl, timestamp: new Date().getTime(), message: err.message });
      }
      if (!req.file) {
        return res
          .status(400)
          .send({ path: req.originalUrl, timestamp: new Date().getTime(), message: 'resource is required' });
      }

      const authenticatedUser = req.authenticatedUser;
      StoryService.postStory(authenticatedUser.id, req.file.filename)
        .then((story) => {
          res.send(story);
        })
        .catch(() => {
          return res
            .status(400)
            .send({ path: req.originalUrl, timestamp: new Date().getTime(), message: 'error occured' });
        });
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
