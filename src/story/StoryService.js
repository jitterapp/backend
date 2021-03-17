const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const Story = require('./Story');
const User = require('../user/User');

const findStoryById = async (id) => {
  const story = Story.findOne({
    where: {
      id,
    },
    include: {
      model: User,
      as: 'creator',
      foreignKey: 'userId',
      attributes: {
        exclude: [
          'password',
          'inactive',
          'activationToken',
          'createdAt',
          'updatedAt',
          'isFriend',
          'isFriendRequestSent',
          'isFriendRequestReceived',
        ],
      },
    },
  });

  return story;
};

const findStories = async (page, size, search = null) => {
  let userWhere = null;
  if (search) {
    userWhere = {
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
    };
  }

  const includeUser = {
    model: User,
    as: 'creator',
    foreignKey: 'userId',
    attributes: {
      exclude: [
        'password',
        'inactive',
        'activationToken',
        'createdAt',
        'updatedAt',
        'isFriend',
        'isFriendRequestSent',
        'isFriendRequestReceived',
      ],
    },
  };

  if (userWhere) {
    includeUser.where = userWhere;
    includeUser.required = true;
  }

  const include = [includeUser];

  const storiesWithCount = await Story.findAndCountAll({
    include,
    limit: size,
    offset: size * page,
  });

  return storiesWithCount;
};

const postStory = async (userId, resource) => {
  const story = await Story.create({
    userId,
    resource,
  });

  return story;
};

module.exports = {
  findStoryById,
  findStories,
  postStory,
};
