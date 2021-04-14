const request = require('supertest');
const mock = require('mock-fs');
const app = require('../src/app');
const db = require('../db/models');
const sequelize = db.sequelize;
const User = db.user;
const bcryt = require('bcrypt');
const { existsSync } = require('fs');

beforeAll(async () => {
  await sequelize.sync();
});

afterAll(async () => {
  mock.restore();
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

const postStory = async (file = '', options = {}) => {
  let agent = request(app).post('/api/1.0/stories');

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.attach('resource', file, 'story.png');
};

describe('Post Story', () => {
  it('returns forbidden when request is sent unauthorized', async () => {
    const response = await postStory();
    expect(response.status).toBe(403);
  });
  it('fails to post story without resource attached', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await postStory('', { token });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('resource is required');
  });
  it('fails to post story with large file', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const size = 1024 * 1024 * 11;
    mock({
      'story.png': Buffer.from('a '.repeat(size).split(' ')),
      uploads: {},
    });
    expect(existsSync('story.png')).toBeTruthy();
    const response = await postStory('story.png', { token });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('File too large');
  });
  it('success to post story', async () => {
    const user = await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const size = 100;
    mock({
      'story.png': Buffer.from('a '.repeat(size).split(' ')),
      uploads: {},
    });
    expect(existsSync('story.png')).toBeTruthy();
    const response = await postStory('story.png', { token });
    expect(response.status).toBe(200);
    expect(response.body.userId).toBe(user.id);
  });
});
