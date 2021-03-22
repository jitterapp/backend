const express = require('express');
const router = express.Router();
const pagination = require('../middleware/pagination');
const tokenAuthentication = require('../middleware/tokenAuthentication');
const ActivityService = require('./ActivityService');

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

module.exports = router;
