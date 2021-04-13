const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const db = require('../../db/models');
const User = db.user;
const Story = db.story;
const { putPublicS3 } = require('../shared/aws');

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
    order: [['createdAt', 'DESC']],
  });

  return storiesWithCount;
};

const postStory = async (userId, resource) => {
  const file = `uploads/${resource}`;
  const fileStream = fs.createReadStream(file);
  const key = path.basename(file);
  let location = resource;
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production') {
    location = await putPublicS3(`stories/${userId}/${key}`, fileStream);
  }
  fs.unlinkSync(file);

  const story = await Story.create({
    userId,
    resource: location,
  });

  return story;
};

module.exports = {
  findStoryById,
  findStories,
  postStory,
};
