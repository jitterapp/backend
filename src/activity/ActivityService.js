const Activity = require('./Activity');
const User = require('../user/User');
const OneSignalService = require('../onesignal/OneSignalService');

const getActivities = async (userId, page = 0, size = 10) => {
  const result = await Activity.findAndCountAll({
    where: {
      userId,
    },
    include: {
      model: User,
      as: 'user',
      attributes: ['id', 'fullname', 'username', 'dob', 'email', 'image'],
    },
    offset: page * size,
    limit: size,
    order: [['createdAt', 'DESC']],
  });
  return result;
};

const logActivity = async (type, userId, fromUserId, description = '', message = '', other = '') => {
  const activity = await Activity.create({
    type,
    userId,
    fromUserId,
    other,
    description,
    message,
  });

  const data = {
    type,
    userId,
    fromUserId,
    other,
    description,
    message,
  };

  let messageToSend = message;
  if (type === 1) {
    // Replied to Jit
    messageToSend = message;
  } else if (type === 2) {
    // Replied to Story
    messageToSend = message;
  } else if (type === 3) {
    // Received friend Request
    const user = await User.findByPk(fromUserId);
    messageToSend = `${user.username} sent you friend request`;
  } else if (type === 4) {
    // Accepted friend Request
    const user = await User.findByPk(fromUserId);
    messageToSend = `${user.username} accepted your friend request`;
  } else if (type === 5) {
    // Rejected friend Request
    const user = await User.findByPk(fromUserId);
    messageToSend = `${user.username} rejected your friend request`;
  } else if (type === 6) {
    // Unfriend
    const user = await User.findByPk(fromUserId);
    messageToSend = `${user.username} removed you from friends`;
  } else if (type === 7) {
    messageToSend = message;
  }

  OneSignalService.sendNotification(userId, messageToSend, data);

  return activity;
};

module.exports = {
  getActivities,
  logActivity,
};
