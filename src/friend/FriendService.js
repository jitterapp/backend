const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const User = require('../user/User');
const Friend = require('./Friend');
const FriendRequest = require('./FriendRequest');

const friendRequest = async (userId, friendId) => {
  const user = await User.findByPk(userId);
  await user.addRequestees(friendId);
  const result = await FriendRequest.findOne({
    where: {
      requesterId: userId,
      requesteeId: friendId,
    },
    include: {
      model: User,
      as: 'requestee',
      attributes: ['id', 'fullname', 'username', 'dob', 'email'],
    },
    attributes: [['createdAt', 'requestDate']],
  });
  return result;
};

const getRequestCount = async (requesterId, requesteeId) => {
  const result = await FriendRequest.count({
    where: { requesteeId, requesterId },
  });
  return result;
};

const getFriendCount = async (userId, friendId) => {
  const result = await Friend.count({
    where: { userId, friendId },
  });
  return result;
};

const getFriendRequestsSent = async (userId, page = 0, size = 10) => {
  const result = await FriendRequest.findAndCountAll({
    where: {
      requesterId: userId,
    },
    include: {
      model: User,
      as: 'requestee',
      attributes: ['id', 'fullname', 'username', 'dob', 'email', 'image', 'gender', 'phonenumber'],
    },
    offset: page * size,
    limit: size,
  });
  return result;
};

const getFriendRequestsReceived = async (userId, page = 0, size = 10) => {
  const result = await FriendRequest.findAndCountAll({
    where: {
      requesteeId: userId,
    },
    include: {
      model: User,
      as: 'requester',
      attributes: ['id', 'fullname', 'username', 'dob', 'email', 'image', 'gender', 'phonenumber'],
    },
    page: page * size,
    limit: size,
  });
  return result;
};

const getFriends = async (userId, page = 0, size = 10, search = '') => {
  const result = await Friend.findAndCountAll({
    where: {
      userId,
    },
    include: {
      model: User,
      as: 'friends',
      attributes: ['id', 'fullname', 'username', 'dob', 'email', 'image', 'gender', 'phonenumber'],
      where: {
        [Op.or]: [
          {
            username: {
              [Op.like]: `%${search}%`,
            },
          },
          {
            fullname: {
              [Op.like]: `%${search}%`,
            },
          },
          {
            email: {
              [Op.like]: `%${search}%`,
            },
          },
        ],
      },
    },
    page: page * size,
    limit: size,
  });
  return result;
};

const acceptFriend = async (userId, friendId) => {
  const user = await User.findByPk(userId);
  await user.addFriends(friendId);
  const reverseUser = await User.findByPk(friendId);
  await reverseUser.addFriends(userId);
  const result = await Friend.findOne({
    where: {
      userId,
      friendId,
    },
    include: {
      model: User,
      as: 'friends',
      where: { id: friendId },
      attributes: ['id', 'fullname', 'username', 'dob', 'email'],
    },
  });
  return result;
};

const rejectFriendRequest = async (userId, requesterId) => {
  const user = await User.findByPk(userId);
  const result = await user.removeRequester(requesterId);
  return result;
};

const cancelFriendRequest = async (userId, requesteeId) => {
  const user = await User.findByPk(userId);
  const result = await user.removeRequestee(requesteeId);
  return result;
};

const cancelFriend = async (userId, friendId) => {
  const user = await User.findByPk(userId);
  const result = await user.removeFriend(friendId);
  const reverseUser = await User.findByPk(friendId);
  const reverseResult = await reverseUser.removeFriend(userId);
  return result && reverseResult;
};

module.exports = {
  friendRequest,
  cancelFriendRequest,
  rejectFriendRequest,
  getRequestCount,
  getFriendCount,
  getFriends,
  getFriendRequestsSent,
  getFriendRequestsReceived,
  cancelFriend,
  acceptFriend,
};
