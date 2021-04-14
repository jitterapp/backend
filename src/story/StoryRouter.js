const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const tokenAuthentication = require('../middleware/tokenAuthentication');
const pagination = require('../middleware/pagination');
const validateRequest = require('../middleware/validateRequest');
const StoryService = require('./StoryService');
const { upload } = require('../shared/upload');

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

router.post('/api/1.0/stories', upload.single('resource'), tokenAuthentication, async (req, res, next) => {
  try {
    if (!req.file) {
      throw new Error('resource is required');
    }

    const authenticatedUser = req.authenticatedUser;
    const story = await StoryService.postStory(authenticatedUser.id, req.file.filename);
    res.send(story);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
