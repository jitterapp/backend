const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');
const sequelize = require('../src/config/database');
const bcryt = require('bcrypt');

beforeAll(async () => {
  await sequelize.sync();
});

beforeEach(async () => {
  await User.destroy({ truncate: { cascade: true } }); //clean user table before each test
});

const activeUser = {
  username: 'user1',
  fullname: 'full name',
  email: 'user1@mail.com',
  password: 'P4ssword',
  inactive: false,
  blockAnonymous: false,
};
const friendUser = {
  username: 'frienduser',
  fullname: 'friend name',
  email: 'friend@mail.com',
  password: 'P4ssword',
  inactive: false,
  blockAnonymous: false,
};

const addUser = async (user = { ...activeUser }) => {
  const hash = await bcryt.hash(user.password, 10);
  user.password = hash;
  return await User.create(user);
};

const auth = async (options = {}) => {
  let token;
  if (options.auth) {
    const response = await request(app).post('/api/1.0/auth').send(options.auth);
    token = response.body.token;
  }

  return token;
};

const postJit = async (content, friendIds = [], options = {}) => {
  let agent = request(app).post('/api/1.0/jits');

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  if (friendIds) {
    return agent.send({ content, friendIds });
  } else {
    return agent.send({ content });
  }
};

const getJits = async (options = {}, isPrivate = false) => {
  let url = '/api/1.0/jits';
  if (isPrivate) {
    url = '/api/1.0/jits/private';
  }
  const agent = request(app).get(url);

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send();
};

const getJit = async (jitId, options = {}) => {
  let url = `/api/1.0/jits/${jitId}`;
  const agent = request(app).get(url);

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send();
};

const replyJit = async (jitId, content, options = {}) => {
  const agent = request(app).post(`/api/1.0/jits/reply/${jitId}`);

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send({ content });
};

const getJitReplies = async (jitId, options = {}) => {
  const agent = request(app).get(`/api/1.0/jits/reply/${jitId}`);

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send();
};

const likeJit = async (jitId, options = {}) => {
  const agent = request(app).post(`/api/1.0/jits/like/${jitId}`);

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send();
};

const unLikeJit = async (jitId, options = {}) => {
  const agent = request(app).delete(`/api/1.0/jits/like/${jitId}`);

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send();
};

const favoriteJit = async (jitId, options = {}) => {
  const agent = request(app).post(`/api/1.0/jits/favorite/${jitId}`);

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send();
};

const unFavoriteJit = async (jitId, options = {}) => {
  const agent = request(app).delete(`/api/1.0/jits/favorite/${jitId}`);

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send();
};

const getAllLikedJits = async (options = {}) => {
  const agent = request(app).get(`/api/1.0/jits/liked`);

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send();
};

const getAllFavoritedJits = async (options = {}) => {
  const agent = request(app).get(`/api/1.0/jits/favorited`);

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send();
};

const getAllJitsByUserId = async (options = {}, userId) => {
  let url = `/api/1.0/jits/all/${userId}`;
  const agent = request(app).get(url);

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send();
};

const getAllPublicJitsByUserId = async (options = {}, userId) => {
  let url = `/api/1.0/jits/public/${userId}`;
  const agent = request(app).get(url);

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send();
};

const getAllPrivateJitsByUserId = async (options = {}, userId) => {
  let url = `/api/1.0/jits/private/${userId}`;
  const agent = request(app).get(url);

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send();
};

describe('Post Jit', () => {
  it('returns forbidden when request is sent unauthorized', async () => {
    const response = await postJit();
    expect(response.status).toBe(403);
  });
  it('can not jit to yrself', async () => {
    const savedUser = await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await postJit('test', [savedUser.id], { token });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('can not jit to yrself');
  });
  it('can not find user', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await postJit('test', [1000], { token });
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('User not found');
  });
  it('fails to post Jit without content', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await postJit(null, null, { token });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failure');
    expect(response.body.validationErrors.content).toBe('content is required');
  });
  it('success to post public Jit', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await postJit('test', null, { token });
    expect(response.status).toBe(200);
    expect(response.body.content).toBe('test');
    expect(response.body.anonymous).toBe(false);
    expect(response.body.ispublic).toBe(true);
  });
  it('success to post private Jit', async () => {
    await addUser();
    const otherUser = await addUser({ ...friendUser });
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await postJit('test', [otherUser.id], { token });
    expect(response.status).toBe(200);
    expect(response.body.content).toBe('test');
    expect(response.body.anonymous).toBe(true);
    expect(response.body.ispublic).toBe(false);
  });
  it('fails to post private Jit to anonymous blocked user', async () => {
    await addUser();
    const otherUser = await addUser({ ...friendUser, blockAnonymous: true });
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await postJit('test', [otherUser.id], { token });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Anonymous Jit is blocked');
  });
});

describe('Get Jits', () => {
  it('returns forbidden when request is sent unauthorized', async () => {
    const response = await getJits();
    expect(response.status).toBe(403);
  });
  it('get all public Jits', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await postJit('test', null, { token });
    expect(response.status).toBe(200);
    const getResponse = await getJits({ token });
    expect(getResponse.body.count).toBe(1);
    expect(getResponse.body.jits.length).toBe(1);
    expect(getResponse.status).toBe(200);
  });
  it('get all private Jits', async () => {
    await addUser();
    const otherUser = await addUser({ ...friendUser });
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await postJit('test', [otherUser.id], { token });
    expect(response.status).toBe(200);

    const friendUserToken = await auth({ auth: { email: friendUser.email, password: friendUser.password } });
    const getResponse = await getJits({ token: friendUserToken }, true);
    expect(getResponse.body.count).toBe(1);
    expect(getResponse.body.jits.length).toBe(1);
    expect(getResponse.status).toBe(200);
  });
});

describe('Get Jit by id', () => {
  it('returns forbidden when request is sent unauthorized', async () => {
    const response = await getJit(1);
    expect(response.status).toBe(403);
  });
  it('get jit by id', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await postJit('test', null, { token });
    expect(response.status).toBe(200);
    const jitResponse = await getJit(response.body.id, { token });
    expect(jitResponse.status).toBe(200);
    expect(jitResponse.body.id).toBe(response.body.id);
  });
  it('can not find jit', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const jitResponse = await getJit(1, { token });
    expect(jitResponse.status).toBe(400);
    expect(jitResponse.body.message).toBe('can not find jit');
  });
});

describe('Jit Reply', () => {
  it('returns forbidden when request is sent unauthorized', async () => {
    const response = await replyJit();
    expect(response.status).toBe(403);
  });
  it('fails to reply without content', async () => {
    await addUser();
    const otherUser = await addUser({ ...friendUser });
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await postJit('test', [otherUser.id], { token });
    expect(response.status).toBe(200);
    const friendUserToken = await auth({ auth: { email: friendUser.email, password: friendUser.password } });
    const replyResponse = await replyJit(response.body.id, null, { token: friendUserToken });
    expect(replyResponse.status).toBe(400);
    expect(replyResponse.body.validationErrors.content).toBe('content is required');
    expect(replyResponse.body.message).toBe('Validation failure');
  });
  it('replies to Jit', async () => {
    await addUser();
    const otherUser = await addUser({ ...friendUser });
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await postJit('test', [otherUser.id], { token });
    expect(response.status).toBe(200);

    const friendUserToken = await auth({ auth: { email: friendUser.email, password: friendUser.password } });
    const replyResponse = await replyJit(response.body.id, 'test reply', { token: friendUserToken });
    expect(replyResponse.status).toBe(200);
    expect(replyResponse.body.jitId).toBe(response.body.id);
    expect(replyResponse.body.content).toBe('test reply');
  });
  it('get all Jit replies', async () => {
    await addUser();
    const otherUser = await addUser({ ...friendUser });
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await postJit('test', [otherUser.id], { token });
    expect(response.status).toBe(200);

    const friendUserToken = await auth({ auth: { email: friendUser.email, password: friendUser.password } });
    const replyResponse = await replyJit(response.body.id, 'test reply', { token: friendUserToken });
    expect(replyResponse.status).toBe(200);

    const getResponse = await getJitReplies(response.body.id, { token });
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.count).toBe(1);
    expect(getResponse.body.rows.length).toBe(1);
    expect(getResponse.body.rows[0].jitId).toBe(response.body.id);
    expect(getResponse.body.rows[0].replier.id).toBe(otherUser.id);
  });
});

describe('Jit Like', () => {
  it('returns forbidden when request is sent unauthorized', async () => {
    const response = await likeJit();
    expect(response.status).toBe(403);
  });
  it('fails to like jit', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await likeJit(1, { token });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('can not find jit');
  });
  it('likes jit', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await postJit('test', null, { token });
    expect(response.status).toBe(200);
    const likeResponse = await likeJit(response.body.id, { token });
    expect(likeResponse.body.id).toBe(response.body.id);
    expect(likeResponse.status).toBe(200);
  });
  it('can not like jit 2 times', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await postJit('test', null, { token });
    expect(response.status).toBe(200);
    const likeResponse = await likeJit(response.body.id, { token });
    expect(likeResponse.status).toBe(200);

    const failedResponse = await likeJit(response.body.id, { token });
    expect(failedResponse.status).toBe(400);
    expect(failedResponse.body.message).toBe('already liked');
  });
  it('unlikes jit', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await postJit('test', null, { token });
    expect(response.status).toBe(200);
    const likeResponse = await likeJit(response.body.id, { token });
    expect(likeResponse.status).toBe(200);

    const unlikeResponse = await unLikeJit(response.body.id, { token });
    expect(unlikeResponse.body.id).toBe(response.body.id);
    expect(unlikeResponse.status).toBe(200);
  });
  it('fails to unlike jit', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await postJit('test', null, { token });
    expect(response.status).toBe(200);

    const unlikeResponse = await unLikeJit(response.body.id, { token });
    expect(unlikeResponse.status).toBe(400);
    expect(unlikeResponse.body.message).toBe('not liked');
  });
  it('gets all liked jits', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await postJit('test', null, { token });
    expect(response.status).toBe(200);
    const likeResponse = await likeJit(response.body.id, { token });
    expect(likeResponse.status).toBe(200);
    const jitsResponse = await getAllLikedJits({ token });
    expect(jitsResponse.status).toBe(200);
    expect(jitsResponse.body.count).toBe(1);
    expect(jitsResponse.body.jits.length).toBe(1);
  });
});

describe('Jit Favorite', () => {
  it('returns forbidden when request is sent unauthorized', async () => {
    const response = await favoriteJit();
    expect(response.status).toBe(403);
  });
  it('fails to favorite jit', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await favoriteJit(1, { token });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('can not find jit');
  });
  it('favorites jit', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await postJit('test', null, { token });
    expect(response.status).toBe(200);
    const favoriteResponse = await favoriteJit(response.body.id, { token });
    expect(favoriteResponse.body.id).toBe(response.body.id);
    expect(favoriteResponse.status).toBe(200);
  });
  it('can not favorite jit 2 times', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await postJit('test', null, { token });
    expect(response.status).toBe(200);
    const favoriteResponse = await favoriteJit(response.body.id, { token });
    expect(favoriteResponse.status).toBe(200);

    const failedResponse = await favoriteJit(response.body.id, { token });
    expect(failedResponse.status).toBe(400);
    expect(failedResponse.body.message).toBe('already marked favorite');
  });
  it('unfavorites jit', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await postJit('test', null, { token });
    expect(response.status).toBe(200);
    const favoriteResponse = await favoriteJit(response.body.id, { token });
    expect(favoriteResponse.status).toBe(200);

    const unfavoriteResponse = await unFavoriteJit(response.body.id, { token });
    expect(unfavoriteResponse.body.id).toBe(response.body.id);
    expect(unfavoriteResponse.status).toBe(200);
  });
  it('fails to unfavorite jit', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await postJit('test', null, { token });
    expect(response.status).toBe(200);

    const unfavoriteResponse = await unFavoriteJit(response.body.id, { token });
    expect(unfavoriteResponse.status).toBe(400);
    expect(unfavoriteResponse.body.message).toBe('not marked favorite');
  });
  it('gets all favorited jits', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await postJit('test', null, { token });
    expect(response.status).toBe(200);
    const likeResponse = await favoriteJit(response.body.id, { token });
    expect(likeResponse.status).toBe(200);
    const jitsResponse = await getAllFavoritedJits({ token });
    expect(jitsResponse.status).toBe(200);
    expect(jitsResponse.body.count).toBe(1);
    expect(jitsResponse.body.jits.length).toBe(1);
  });
});

describe('Get All jits by userId', () => {
  it('returns forbidden when request is sent unauthorized', async () => {
    const response = await getAllJitsByUserId();
    expect(response.status).toBe(403);
  });
  it('success to get all jits by userId', async () => {
    const user = await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await postJit('test', null, { token });
    expect(response.status).toBe(200);
    const otherUser = await addUser({ ...friendUser });
    const prviateJitResponse = await postJit('test', [otherUser.id], { token });
    expect(prviateJitResponse.status).toBe(200);
    const getAllJitsResponse = await getAllJitsByUserId({ token }, user.id);
    expect(getAllJitsResponse.status).toBe(200);
    expect(getAllJitsResponse.body.count).toBe(2);
  });
});

describe('Get All public jits by userId', () => {
  it('returns forbidden when request is sent unauthorized', async () => {
    const response = await getAllPublicJitsByUserId();
    expect(response.status).toBe(403);
  });
  it('success to get all public jits by userId', async () => {
    const user = await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await postJit('test', null, { token });
    expect(response.status).toBe(200);
    const otherUser = await addUser({ ...friendUser });
    const prviateJitResponse = await postJit('test', [otherUser.id], { token });
    expect(prviateJitResponse.status).toBe(200);
    const getAllJitsResponse = await getAllPublicJitsByUserId({ token }, user.id);
    expect(getAllJitsResponse.status).toBe(200);
    expect(getAllJitsResponse.body.count).toBe(1);
  });
});

describe('Get All private jits by userId', () => {
  it('returns forbidden when request is sent unauthorized', async () => {
    const response = await getAllPrivateJitsByUserId();
    expect(response.status).toBe(403);
  });
  it('success to get all public jits by userId', async () => {
    const user = await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await postJit('test', null, { token });
    expect(response.status).toBe(200);
    const otherUser = await addUser({ ...friendUser });
    const prviateJitResponse = await postJit('test', [otherUser.id], { token });
    expect(prviateJitResponse.status).toBe(200);
    const getAllJitsResponse = await getAllPrivateJitsByUserId({ token }, user.id);
    expect(getAllJitsResponse.status).toBe(200);
    expect(getAllJitsResponse.body.count).toBe(1);
  });
});
