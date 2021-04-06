const request = require('supertest');
const mock = require('mock-fs');
const { existsSync } = require('fs');
const app = require('../src/app');
const User = require('../src/user/User');
const Jit = require('../src/jit/Jit');
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
};

const otherUser = {
  username: 'otheruser',
  fullname: 'other name',
  email: 'other@mail.com',
  password: 'P4ssword',
  inactive: false,
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

const getActivities = async (options = {}) => {
  let agent = request(app).get('/api/1.0/activities');

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send();
};

const logActivity = async (type, message, userId, referenceId, options = {}) => {
  let agent = request(app).post('/api/1.0/activities');

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send({
    type,
    message,
    userId,
    referenceId,
  });
};

const postStory = async (file = '', options = {}) => {
  let agent = request(app).post('/api/1.0/stories');

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.attach('resource', file, 'story.png');
};

describe('Get Activities', () => {
  it('returns forbidden when request is sent unauthorized', async () => {
    const response = await getActivities();
    expect(response.status).toBe(403);
  });
  it('get activities', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });

    const response = await getActivities({ token });
    expect(response.status).toBe(200);
    expect(response.body.count).toBe(0);
    expect(response.body.rows.length).toBe(0);
    expect(Object.keys(response.body)).toEqual(['count', 'rows']);
  });
});

describe('Log Activity', () => {
  it('returns forbidden when request is sent unauthorized', async () => {
    const response = await logActivity();
    expect(response.status).toBe(403);
  });
  it('fails to log activity without type', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });

    const response = await logActivity('', '', 1, 1, { token });
    expect(response.status).toBe(400);
    expect(response.body.validationErrors.type).toBe('type should be integer');
  });
  it('fails to log activity without userId', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });

    const response = await logActivity(1, '', '', 1, { token });
    expect(response.status).toBe(400);
    expect(response.body.validationErrors.userId).toBe('userId should be integer');
  });
  it('fails to log activity with invalid referenceId', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });

    const response = await logActivity(1, 'test', 1, '', { token });
    expect(response.status).toBe(400);
    expect(response.body.validationErrors.referenceId).toBe('referenceId should be integer');
  });
  it('can not log activity to yrself', async () => {
    const user = await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });

    const response = await logActivity(1, 'test', user.id, 1, { token });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('can not log activity to yrself');
  });
  it('can not find user', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });

    const response = await logActivity(1, 'test', 2, 1, { token });
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('User not found');
  });
  it('can not find jit', async () => {
    await addUser();
    const user = await addUser(otherUser);
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });

    const response = await logActivity(1, 'test', user.id, 1, { token });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('can not find jit');
  });
  it('can not find story', async () => {
    await addUser();
    const user = await addUser(otherUser);
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });

    const response = await logActivity(2, 'test', user.id, 1, { token });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('can not find story');
  });
  it('requires message when type is direct message log', async () => {
    await addUser();
    const user = await addUser(otherUser);
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });

    const response = await logActivity(7, '', user.id, 1, { token });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('message is required');
  });
  it('type should be 1, 2, or 7', async () => {
    await addUser();
    const user = await addUser(otherUser);
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });

    const response = await logActivity(8, '', user.id, 1, { token });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('type should be 1, 2 or 7');
  });
  it('success to log direct message log', async () => {
    const firstUser = await addUser();
    const user = await addUser(otherUser);
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });

    const response = await logActivity(7, 'test', user.id, 0, { token });
    expect(response.status).toBe(200);
    expect(response.body.type).toBe(7);
    expect(response.body.description).toBe('sent you a message');
    expect(response.body.message).toBe('test');
    expect(response.body.userId).toBe(user.id);
    expect(response.body.fromUserId).toBe(firstUser.id);
  });
  it('success to log reply to jit', async () => {
    const firstUser = await addUser();
    const user = await addUser(otherUser);
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const jit = await Jit.create({
      userId: user.id,
      content: 'test',
      ispublic: 1,
      anonymous: 0,
    });

    const response = await logActivity(1, '', user.id, jit.id, { token });
    expect(response.status).toBe(200);
    expect(response.body.type).toBe(1);
    expect(response.body.userId).toBe(user.id);
    expect(response.body.fromUserId).toBe(firstUser.id);
    expect(response.body.other).toBe(jit.id);
    expect(response.body.description).toBe('replied to jit');
  });
  it('success to log reply to story', async () => {
    const firstUser = await addUser();
    const user = await addUser(otherUser);
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const size = 100;
    mock({
      'story.png': Buffer.from('a '.repeat(size).split(' ')),
      uploads: {},
    });
    expect(existsSync('story.png')).toBeTruthy();
    const story = await postStory('story.png', { token });
    expect(story.status).toBe(200);

    const response = await logActivity(2, '', user.id, story.body.id, { token });
    expect(response.status).toBe(200);
    expect(response.body.type).toBe(2);
    expect(response.body.userId).toBe(user.id);
    expect(response.body.fromUserId).toBe(firstUser.id);
    expect(response.body.other).toBe(story.body.id);
    expect(response.body.description).toBe('replied to story');
  });
});
