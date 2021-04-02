const OneSignal = require('./OneSignal');

const getOnesignalUserIds = async (userId) => {
  const result = await OneSignal.findAll({
    where: {
      userId,
    },
  });
  return result;
};

const findOnesignalUserId = async (userId, onesignalUserId) => {
  const result = await OneSignal.findOne({
    where: {
      userId,
      onesignalUserId,
    },
  });
  return result;
};

const registerOneSignalUserId = async (userId, onesignalUserId) => {
  const result = await OneSignal.create({
    userId,
    onesignalUserId,
  });
  return result;
};

const removeByUserIdAndOneSignalUserId = async (userId, onesignalUserId) => {
  const result = await OneSignal.destroy({
    where: {
      userId,
      onesignalUserId,
    },
  });
  return result;
};

module.exports = {
  getOnesignalUserIds,
  registerOneSignalUserId,
  findOnesignalUserId,
  removeByUserIdAndOneSignalUserId,
};
