const ActivityService = require('../activity/ActivityService');
const logActivity = (type) => {
  return (req, res) => {
    const fromUserId = req.authenticatedUser.id;
    let userId;
    if (type === 3) {
      userId = req.params.userId;
      ActivityService.logActivity(type, userId, fromUserId, 'received friend request');
    } else if (type === 4) {
      const userId = req.params.requesterId;
      ActivityService.logActivity(type, userId, fromUserId, 'accepted friend request');
    } else if (type === 5) {
      const userId = req.params.requesterId;
      ActivityService.logActivity(type, userId, fromUserId, 'rejected friend request');
    } else if (type === 6) {
      const userId = req.params.friendId;
      ActivityService.logActivity(type, userId, fromUserId, 'unfriended');
    }

    res.send(res.result);
  };
};

module.exports = logActivity;
