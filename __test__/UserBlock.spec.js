const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');
const sequelize = require('../src/config/database');
const bcrypt = require('bcrypt');

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
  username: 'frienduser',
  fullname: 'friend name',
  email: 'friend@mail.com',
  password: 'P4ssword',
  inactive: false,
};

const addUser = async (user = { ...activeUser }) => {
  const hash = await bcrypt.hash(user.password, 10);
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

const block = async (userId, options = {}) => {
  let agent = request(app).post(`/api/1.0/userblocks/${userId}`);

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send();
};

const blockAnonymous = async (options = {}) => {
  let agent = request(app).post(`/api/1.0/userblocks/anonymous`);

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send();
};

const unblock = async (userId, options = {}) => {
  let agent = request(app).delete(`/api/1.0/userblocks/${userId}`);

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send();
};

const unBlockAnonymous = async (options = {}) => {
  let agent = request(app).delete(`/api/1.0/userblocks/anonymous`);

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send();
};

const listBlockedUsers = async (options = {}) => {
  let agent = request(app).get('/api/1.0/userblocks');

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send();
};

describe('Block User', () => {
  it('returns forbidden when request is sent unauthorized', async () => {
    const response = await block(1);
    expect(response.status).toBe(403);
  });
  it('fails to block yrself', async () => {
    const savedUser = await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await block(savedUser.id, { token });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('can not block yourself');
  });
  it('fails to block not registered user', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await block(123, { token });
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('User not found');
  });
  it('success block user', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const other = await addUser(otherUser);
    const response = await block(other.id, { token });
    expect(response.status).toBe(200);
    expect(response.body.isBlocked).toBe(true);
    expect(response.body.id).toBe(other.id);
  });
});

describe('UnBlock User', () => {
  it('returns forbidden when request is sent unauthorized', async () => {
    const response = await unblock(1);
    expect(response.status).toBe(403);
  });
  it('fails to unblock not blocked user', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const other = await addUser(otherUser);
    const response = await unblock(other.id, { token });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('not blocked');
  });
  it('success unblock user', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const other = await addUser(otherUser);
    const response = await block(other.id, { token });
    expect(response.status).toBe(200);
    const unblockResponse = await unblock(other.id, { token });
    expect(unblockResponse.status).toBe(200);
    expect(unblockResponse.body.id).toBe(other.id);
    expect(unblockResponse.body.isBlocked).toBe(false);
  });
});

describe('Listing Blocked Users', () => {
  it('returns forbidden when request is sent unauthorized', async () => {
    const response = await listBlockedUsers();
    expect(response.status).toBe(403);
  });
  it('list blocked users', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const other = await addUser(otherUser);
    const response = await block(other.id, { token });
    expect(response.status).toBe(200);
    const listResponse = await listBlockedUsers({ token });
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.count).toBe(1);
  });
});

describe('Block anonymous', () => {
  it('returns forbidden when request is sent unauthorized', async () => {
    const response = await blockAnonymous();
    expect(response.status).toBe(403);
  });
  it('success to block anonymous', async () => {
    const user = await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await blockAnonymous({ token });
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(user.id);
    expect(response.body.blockAnonymous).toBe(true);
  });
});

describe('UnBlock anonymous', () => {
  it('returns forbidden when request is sent unauthorized', async () => {
    const response = await unBlockAnonymous();
    expect(response.status).toBe(403);
  });
  it('success to block anonymous', async () => {
    const user = await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await unBlockAnonymous({ token });
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(user.id);
    expect(response.body.blockAnonymous).toBe(false);
  });
});
