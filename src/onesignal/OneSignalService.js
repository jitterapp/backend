const https = require('https');
const onesignalAppId = process.env.ONESIGNAL_APP_ID;
const db = require('../../db/models');
const OneSignal = db.oneSignal;

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

const sendNotification = async (userId, contents, data = [], title = 'Jitter') => {
  const onesignalUserIds = await getOnesignalUserIds(userId);
  const playerIds = onesignalUserIds.map((item) => item.onesignalUserId);
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
  };
  const options = {
    host: 'onesignal.com',
    port: 443,
    path: '/api/v1/notifications',
    method: 'POST',
    headers: headers,
  };
  const message = {
    app_id: onesignalAppId,
    contents: { en: contents },
    headings: {
      en: title,
    },
    include_player_ids: playerIds,
    data,
  };

  const req = https.request(options);
  req.write(JSON.stringify(message));
  req.end();
};

module.exports = {
  getOnesignalUserIds,
  registerOneSignalUserId,
  findOnesignalUserId,
  removeByUserIdAndOneSignalUserId,
  sendNotification,
};
