const Activity = require('./Activity');
const User = require('../user/User');

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
  return activity;
};

module.exports = {
  getActivities,
  logActivity,
};
