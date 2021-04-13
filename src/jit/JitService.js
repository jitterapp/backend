const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const db = require('../../db/models');
const User = db.user;
const Jit = db.jit;
const JitReply = db.jitReply;
const JitLike = db.jitLike;
const JitFavorite = db.jitFavorite;
const JitPrivate = db.jitPrivate;

const proceedJitsWithCount = async (jitsWithCount, authenticatedUser) => {
  const jits = [];
  const { rows } = jitsWithCount;
  for (let i = 0; i < rows.length; i++) {
    const jit = rows[i];
    const replyCount = await jit.countJitReplies();
    const favoriteCount = await jit.countJitFavorites();
    const likeCount = await jit.countJitLikes();

    let userReplyCount = 0;
    let userFavoriteCount = 0;
    let userLikeCount = 0;
    if (authenticatedUser) {
      const authUserId = authenticatedUser.id;
      userReplyCount = await jit.countJitReplies({ where: { userId: authUserId } });
      userFavoriteCount = await jit.countJitFavorites({ where: { userId: authUserId } });
      userLikeCount = await jit.countJitLikes({ where: { userId: authUserId } });
    }

    const result = jit.toJSON();
    result.replyCount = replyCount;
    result.favoriteCount = favoriteCount;
    result.likeCount = likeCount;

    result.replied = !!userReplyCount;
    result.favorited = !!userFavoriteCount;
    result.liked = !!userLikeCount;

    delete result.jitLikes;
    delete result.jitFavorites;

    jits.push(result);
  }

  return {
    jits,
    count: jitsWithCount.count,
  };
};

const postJit = async (userId, content, friendIds = [], ispublic = true, anonymous = false) => {
  const jit = await Jit.create({
    userId,
    content,
    ispublic,
    anonymous,
  });

  if (anonymous && friendIds) {
    friendIds.map((friendId) => {
      JitPrivate.create({ userId: friendId, jitId: jit.id });
    });
  }

  return jit;
};

const findJits = async (
  authenticatedUser,
  page,
  size,
  ispublic = 0,
  anonymous = 0,
  userId = 0,
  search = null,
  creatorId = 0
) => {
  const where = {};
  if (ispublic) {
    where.ispublic = ispublic;
  }
  if (anonymous) {
    where.anonymous = anonymous;
  }

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
  if (creatorId) {
    if (userWhere) {
      userWhere.id = creatorId;
    } else {
      userWhere = {
        id: creatorId,
      };
    }
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

  if (userId) {
    include.push({
      model: JitPrivate,
      where: { userId },
    });
  }

  const jitsWithCount = await Jit.findAndCountAll({
    where,
    include,
    limit: size,
    offset: size * page,
    order: [['createdAt', 'DESC']],
  });

  const result = await proceedJitsWithCount(jitsWithCount, authenticatedUser);

  return result;
};

const findJitById = async (id) => {
  const jit = await Jit.findOne({
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

  let result;
  if (jit) {
    result = jit.toJSON();
    const favoriteCount = await jit.countJitFavorites();
    const likeCount = await jit.countJitLikes();
    const replyCount = await jit.countJitReplies();
    result.favoriteCount = favoriteCount;
    result.replyCount = replyCount;
    result.likeCount = likeCount;
  }
  return result;
};

const findRepliesByJitId = async (jitId, page, size) => {
  const repliesWithCount = await JitReply.findAndCountAll({
    where: {
      jitId,
    },
    include: {
      model: User,
      as: 'replier',
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
    limit: size,
    offset: size * page,
  });

  return repliesWithCount;
};

const likeJit = async (userId, jitId) => {
  await JitLike.create({ userId, jitId });
  const jit = await findJitById(jitId);
  return jit;
};

const unlikeJit = async (userId, jitId) => {
  await JitLike.destroy({ where: { userId, jitId } });
  const jit = await findJitById(jitId);
  return jit;
};

const favoriteJit = async (userId, jitId) => {
  await JitFavorite.create({ userId, jitId });
  const jit = await findJitById(jitId);
  return jit;
};

const unfavoriteJit = async (userId, jitId) => {
  await JitFavorite.destroy({ where: { userId, jitId } });
  const jit = await findJitById(jitId);
  return jit;
};

const replyJit = async (userId, jitId, content) => {
  const jitReply = await JitReply.create({ userId, jitId, content });
  return jitReply;
};

const hasJitFavorite = async (userId, jitId) => {
  const jit = await Jit.findByPk(jitId);
  const has = await jit.countJitFavorites({ where: { userId } });
  return !!has;
};

const hasJitLike = async (userId, jitId) => {
  const jit = await Jit.findByPk(jitId);
  const has = await jit.countJitLikes({ where: { userId } });
  return !!has;
};

const findJitsLiked = async (authenticatedUser, page, size) => {
  const include = [
    {
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
    {
      model: JitLike,
      where: {
        userId: authenticatedUser.id,
      },
    },
  ];
  const jitsWithCount = await Jit.findAndCountAll({
    include,
    limit: size,
    offset: size * page,
  });

  const result = await proceedJitsWithCount(jitsWithCount, authenticatedUser);

  return result;
};

const findJitsFavorited = async (authenticatedUser, page, size) => {
  const include = [
    {
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
    {
      model: JitFavorite,
      where: {
        userId: authenticatedUser.id,
      },
    },
  ];
  const jitsWithCount = await Jit.findAndCountAll({
    include,
    limit: size,
    offset: size * page,
  });

  const result = await proceedJitsWithCount(jitsWithCount, authenticatedUser);

  return result;
};

module.exports = {
  postJit,
  findJits,
  findJitById,
  findRepliesByJitId,
  hasJitFavorite,
  hasJitLike,
  likeJit,
  favoriteJit,
  unlikeJit,
  unfavoriteJit,
  replyJit,
  findJitsLiked,
  findJitsFavorited,
};
