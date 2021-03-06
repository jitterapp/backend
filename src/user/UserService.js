const fs = require('fs');
const path = require('path');
const db = require('../../db/models');
const User = db.user;
const UserBlock = db.userBlock;
const UserImage = db.userImage;

const bcrypt = require('bcrypt');
const EmailService = require('../email/EmailService');
const sequelize = db.sequelize;
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const EmailException = require('../email/EmailException');
const InvalidTokenException = require('./InvalidTokenException');
const UserNotFoundException = require('./UserNotFoundException');
const { randomString } = require('../shared/generator');
const { putPublicS3 } = require('../shared/aws');
const saltRounds = 10;

const save = async (body) => {
  const { fullname, username, email, password, dob, phonenumber, gender } = body;
  const hash = await bcrypt.hash(password, saltRounds);
  const user = {
    fullname,
    username,
    email,
    dob,
    phonenumber,
    gender,
    password: hash,
    activationToken: randomString(16),
  };
  const transaction = await sequelize.transaction();
  await User.create(user, { transaction });
  try {
    await EmailService.sendAccountActivation(email, user.activationToken);
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw new EmailException();
  }
};

const findByEmail = async (email) => {
  return await User.findOne({ where: { email: email } });
};

const findByPhonenumber = async (phonenumber) => {
  return await User.findOne({ where: { phonenumber: phonenumber } });
};

const findByPhoneNumbers = async (authenticatedUser, phonenumbers) => {
  const usersByPhoneNumbers = await User.findAll({
    where: {
      phonenumber: { [Op.in]: phonenumbers },
      id: { [Op.not]: authenticatedUser ? authenticatedUser.id : 0 },
      inactive: false,
    },
    attributes: [
      'id',
      'username',
      'fullname',
      'email',
      'dob',
      'phonenumber',
      'gender',
      'isFriend',
      'isFriendRequestSent',
      'isFriendRequestReceived',
      'image',
    ],
    include: [
      {
        model: User,
        as: 'Friends',
        where: {
          id: authenticatedUser ? authenticatedUser.id : 0,
        },
        required: false,
        attributes: ['id'],
      },
      {
        model: User,
        as: 'Requestees',
        where: {
          id: authenticatedUser ? authenticatedUser.id : 0,
        },
        required: false,
        attributes: ['id'],
      },
      {
        model: User,
        as: 'Requesters',
        where: {
          id: authenticatedUser ? authenticatedUser.id : 0,
        },
        required: false,
        attributes: ['id'],
      },
      {
        model: UserImage,
        required: false,
        attributes: ['image'],
      },
    ],
  });

  const users = usersByPhoneNumbers.map((user) => {
    const result = user.toJSON();
    delete result.Friends;
    delete result.Requestees;
    delete result.Requesters;
    return result;
  });

  return users;
};

const activate = async (token) => {
  const user = await User.findOne({ where: { activationToken: token } });
  if (!user) {
    throw new InvalidTokenException();
  }
  user.inactive = false;
  user.activationToken = null;
  await user.save();
};

const getUsers = async (page, size, authenticatedUser, search = '') => {
  const usersWithCount = await User.findAndCountAll({
    where: {
      inactive: false,
      id: {
        [Op.not]: authenticatedUser ? authenticatedUser.id : 0,
      },
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
    attributes: [
      'id',
      'username',
      'fullname',
      'email',
      'dob',
      'phonenumber',
      'gender',
      'isFriend',
      'isFriendRequestSent',
      'isFriendRequestReceived',
      'image',
    ],
    include: [
      {
        model: User,
        as: 'Friends',
        where: {
          id: authenticatedUser ? authenticatedUser.id : 0,
        },
        required: false,
        attributes: ['id'],
      },
      {
        model: User,
        as: 'Requestees',
        where: {
          id: authenticatedUser ? authenticatedUser.id : 0,
        },
        required: false,
        attributes: ['id'],
      },
      {
        model: User,
        as: 'Requesters',
        where: {
          id: authenticatedUser ? authenticatedUser.id : 0,
        },
        required: false,
        attributes: ['id'],
      },
      {
        model: UserImage,
        required: false,
        attributes: ['image'],
      },
    ],
    limit: size,
    offset: size * page,
  });

  const users = [];
  const rows = usersWithCount.rows;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].toJSON();
    delete row.Friends;
    delete row.Requestees;
    delete row.Requesters;
    row.isBlocked = await isBlocked(authenticatedUser ? authenticatedUser.id : 0, row.id);
    users.push(row);
  }

  return {
    content: users,
    page,
    size,
    totalPages: Math.ceil(usersWithCount.count / size),
  };
};

const getUser = async (id, authenticatedUser = null, includePassword = false) => {
  const attributes = [
    'id',
    'username',
    'email',
    'fullname',
    'dob',
    'phonenumber',
    'gender',
    'isFriend',
    'public',
    'complete',
    'blockAnonymous',
    'image',
    'isFriendRequestSent',
    'isFriendRequestReceived',
  ];
  if (includePassword) {
    attributes.push('password');
  }
  const user = await User.findOne({
    where: { id: id, inactive: false },
    attributes,
    include: [
      {
        model: User,
        as: 'Friends',
        where: {
          id: authenticatedUser ? authenticatedUser.id : 0,
        },
        required: false,
        attributes: ['id'],
      },
      {
        model: User,
        as: 'Requestees',
        where: {
          id: authenticatedUser ? authenticatedUser.id : 0,
        },
        required: false,
        attributes: ['id'],
      },
      {
        model: User,
        as: 'Requesters',
        where: {
          id: authenticatedUser ? authenticatedUser.id : 0,
        },
        required: false,
        attributes: ['id'],
      },
      {
        model: UserImage,
        required: false,
        attributes: ['image'],
      },
    ],
  });
  if (!user) {
    throw new UserNotFoundException();
  }

  const friendCount = await user.countFriends();
  const likeCount = await user.countJitLikes();
  const favoriteCount = await user.countJitFavorites();
  const replyCount = await user.countJitReplies();
  const jitScore = 5 * replyCount;
  const blocked = await isBlocked(authenticatedUser ? authenticatedUser.id : 0, id);

  const result = user.toJSON();
  delete result.Friends;
  delete result.Requestees;
  delete result.Requesters;

  result.friendCount = friendCount;
  result.likeCount = likeCount;
  result.favoriteCount = favoriteCount;
  result.replyCount = replyCount;
  result.jitScore = jitScore;
  result.isBlocked = blocked;

  return result;
};

const updateUser = async (id, updateBody, image = null) => {
  const user = await User.findOne({ where: { id: id } });
  user.username = updateBody.username || user.username;
  user.dob = updateBody.dob || user.dob;
  user.fullname = updateBody.fullname || user.fullname;
  user.phonenumber = updateBody.phonenumber || user.phonenumber;
  user.gender = updateBody.gender || user.gender;
  user.complete = 1;
  if ('public' in updateBody) {
    user.public = updateBody.public;
  }

  if (image) {
    const file = `uploads/${image}`;
    const fileStream = fs.createReadStream(file);
    const key = path.basename(file);
    let location = image;
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production') {
      location = await putPublicS3(`profile/${id}/${key}`, fileStream);
    }
    fs.unlinkSync(file);
    user.image = location;
  }

  await user.save();
  const result = user.toJSON();
  delete result.password;
  return result;
};

const deleteUser = async (id) => {
  await User.destroy({ where: { id: id } });
};

const updatePassword = async (id, password) => {
  const user = await User.findOne({ where: { id: id } });
  const hash = await bcrypt.hash(password, saltRounds);
  user.password = hash;
  await user.save();
};

const blockUser = async (userId, blockedUserId) => {
  const userBlock = await UserBlock.create({
    userId,
    blockedUserId,
  });
  return userBlock;
};

const unblockUser = async (userId, blockedUserId) => {
  await UserBlock.destroy({
    where: {
      userId,
      blockedUserId,
    },
  });
};

const findBlockedUsers = async (userId, page = 0, size = 10, search = '') => {
  const users = UserBlock.findAndCountAll({
    where: {
      userId,
    },
    include: {
      model: User,
      as: 'user',
      attributes: ['id', 'fullname', 'username', 'dob', 'email'],
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

  return users;
};

const isBlocked = async (userId, blockedUserId) => {
  const user = await User.findByPk(userId);
  if (user) {
    const count = await user.countUserBlocks({
      where: {
        userId,
        blockedUserId,
      },
    });
    return !!count;
  }
  return false;
};

const sendResetPassword = async (email) => {
  try {
    const activationToken = randomString(16);
    const user = await findByEmail(email);
    user.activationToken = activationToken;
    await user.save();
    await EmailService.sendPasswordReset(email, user.activationToken);
    return user;
  } catch (err) {
    throw new EmailException();
  }
};

const resetPassword = async (token, password) => {
  const user = await User.findOne({
    where: {
      activationToken: token,
    },
  });
  if (!user) {
    throw new Error('user not found');
  }
  const hash = await bcrypt.hash(password, saltRounds);
  user.activationToken = '';
  user.password = hash;
  user.save();
  return user;
};

const getImages = async (userId) => {
  const images = await UserImage.findAll({
    where: {
      userId,
    },
  });
  return images;
};

const postImage = async (userId, image) => {
  const file = `uploads/${image}`;
  const fileStream = fs.createReadStream(file);
  const key = path.basename(file);
  let location = image;
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production') {
    location = await putPublicS3(`profile/${userId}/${key}`, fileStream);
  }
  fs.unlinkSync(file);

  const userImage = await UserImage.create({
    userId,
    image: location,
  });

  return userImage;
};

const updateImage = async (id, userId, image) => {
  const file = `uploads/${image}`;
  const fileStream = fs.createReadStream(file);
  const key = path.basename(file);
  let location = image;
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production') {
    location = await putPublicS3(`profile/${userId}/${key}`, fileStream);
  }
  fs.unlinkSync(file);

  const userImage = await UserImage.findOne({ where: { id } });
  userImage.image = location;
  await userImage.save();

  return userImage;
};

const removeImage = async (id) => {
  await UserImage.destroy({
    where: {
      id,
    },
  });
  return true;
};

const findImageById = async (id) => {
  const userImage = await UserImage.findByPk(id);
  return userImage;
};

const blockAnonymous = async (userId) => {
  const user = await User.findOne({ where: { id: userId } });
  user.blockAnonymous = true;
  await user.save();
  return user;
};

const unBlockAnonymous = async (userId) => {
  const user = await User.findOne({ where: { id: userId } });
  user.blockAnonymous = false;
  await user.save();
  return user;
};

module.exports = {
  save,
  findByEmail,
  findByPhonenumber,
  findByPhoneNumbers,
  activate,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  updatePassword,
  isBlocked,
  blockUser,
  unblockUser,
  findBlockedUsers,
  sendResetPassword,
  resetPassword,
  postImage,
  getImages,
  removeImage,
  updateImage,
  findImageById,
  blockAnonymous,
  unBlockAnonymous,
};
