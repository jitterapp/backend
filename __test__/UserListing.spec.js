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

const auth = async (options = {}) => {
  let token;
  if (options.auth) {
    const response = await request(app).post('/api/1.0/auth').send(options.auth);
    token = response.body.token;
  }

  return token;
};

const getUsers = (options = {}) => {
  const agent = request(app).get('/api/1.0/users');
  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent;
};

const getUsersByPhoneNumbers = (phonenumbers = [], options = {}) => {
  const agent = request(app).post('/api/1.0/users/findByPhonenumbers');
  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send({ phonenumbers });
};

const addUsers = async (activeUserCount, inactiveUserCount = 0) => {
  const hash = await bcrypt.hash('P4ssword', 10);
  for (let i = 0; i < activeUserCount + inactiveUserCount; i++) {
    await User.create({
      username: `user${i + 1}`,
      email: `user${i + 1}@mail.com`,
      inactive: i >= activeUserCount,
      password: hash,
      phonenumber: `615274828${i}`,
    });
  }
};

describe('Listing users', () => {
  it('returns 200 ok when there are no users in database', async () => {
    const response = await request(app).get('/api/1.0/users');
    expect(response.status).toBe(200);
  });
  it('returns page object as reponse body', async () => {
    const response = await request(app).get('/api/1.0/users');
    expect(response.body).toEqual({
      content: [],
      page: 0,
      size: 10,
      totalPages: 0,
    });
  });
  it('returns 10 users in page content when there are 11 users in database', async () => {
    await addUsers(11);
    const response = await getUsers();
    expect(response.body.content.length).toBe(10);
  });
  it('returns 6 users in page content when there are 6 active users and 5 inactive users in database', async () => {
    await addUsers(6, 5);
    const response = await getUsers();
    expect(response.body.content.length).toBe(6);
  });
  it('returns id, username, fullname, email, image, phonenumber, and dob in content array for each user', async () => {
    await addUsers(6, 5);
    const response = await getUsers();
    const user = response.body.content[0];
    expect(Object.keys(user)).toEqual([
      'isFriend',
      'isFriendRequestSent',
      'isFriendRequestReceived',
      'id',
      'username',
      'fullname',
      'email',
      'dob',
      'phonenumber',
      'gender',
      'image',
      'userImages',
      'isBlocked',
    ]);
  });
  it('returns 2 as total pages when there are 15 active and 7 inactive users', async () => {
    await addUsers(15, 7);
    const response = await getUsers();
    expect(response.body.totalPages).toEqual(2);
  });

  it('returns second page users and page indicator when page is set as 1 in request parameter', async () => {
    await addUsers(15);
    const response = await getUsers().query({ page: 1 });
    expect(response.body.content[0].username).toBe('user11'); //each page shows 10 users
    expect(response.body.page).toBe(1);
  });
  it('returns the first page when page is set below zero as request parameter', async () => {
    await addUsers(15);
    const response = await getUsers().query({ page: -5 });
    expect(response.body.page).toBe(0);
  });
  it('returns 5 users and corresponding size indicator when size is set as 5 in req parameter ', async () => {
    await addUsers(15, 7);
    const response = await getUsers().query({ size: 5 });
    expect(response.body.content.length).toBe(5);
    expect(response.body.size).toBe(5);
  });
  it('returns 10 users and corresponding size indicator when size is set to 1000 ', async () => {
    await addUsers(15, 7);
    const response = await getUsers().query({ size: 1000 });
    expect(response.body.content.length).toBe(10);
    expect(response.body.size).toBe(10);
  });
  it('returns 10 users and corresponding size indicator when size is set to 0 ', async () => {
    await addUsers(15, 7);
    const response = await getUsers().query({ size: 0 });
    expect(response.body.content.length).toBe(10);
    expect(response.body.size).toBe(10);
  });
  it('returns page as 0 and size is 10 when non numeric query params are provided ', async () => {
    await addUsers(15, 7);
    const response = await getUsers().query({ size: 'size', page: 'page' });
    expect(response.body.page).toBe(0);
    expect(response.body.size).toBe(10);
  });
  it('returns user page with users except the user who is logged when request has valid authorization ', async () => {
    await addUsers(11);
    const token = await auth({ auth: { email: 'user1@mail.com', password: 'P4ssword' } });
    const response = await getUsers({ token: token });
    // we are showing one page becuase its 10 users per page and we are not showing the logged in user.
    expect(response.body.totalPages).toBe(1);
  });
  it('fails to get users by phonenumbers', async () => {
    await addUsers(15);
    const phonenumbers = [];
    for (let i = 0; i < 10; i++) {
      phonenumbers.push(`615-274-828${i}`);
    }
    const response = await getUsersByPhoneNumbers();
    expect(response.status).toBe(400);
  });
  it('returns 10 users by phonenumbers', async () => {
    await addUsers(15);
    const phonenumbers = [];
    for (let i = 0; i < 10; i++) {
      phonenumbers.push(`615-274-828${i}`);
    }
    const response = await getUsersByPhoneNumbers(phonenumbers);
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(10);
  });
});

describe('Get user', () => {
  const getUser = (id = 5) => {
    return request(app).get('/api/1.0/users/' + id);
  };
  it('returns a 404 when a user is not found and message saying user not found', async () => {
    const response = await getUser();
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('User not found');
  });
  it('returns proper error body when user not found', async () => {
    const nowInMillis = new Date().getTime();
    const response = await getUser();
    const error = response.body;
    expect(error.path).toBe('/api/1.0/users/5');
    expect(error.timestamp).toBeGreaterThan(nowInMillis);
    expect(Object.keys(error)).toEqual(['path', 'timestamp', 'message']);
  });
  it('returns 200 when active user exists', async () => {
    const user = await User.create({
      username: 'user1',
      email: 'user1@Mail.com',
      password: 'P4ssword',
      inactive: false,
    });

    const response = await getUser(user.id);
    expect(response.status).toBe(200);
  });
  it('returns id, username, and email in response body', async () => {
    const user = await User.create({
      username: 'user1',
      email: 'user1@Mail.com',
      password: 'P4ssword',
      inactive: false,
    });

    const response = await getUser(user.id);
    expect(Object.keys(response.body)).toEqual([
      'isFriend',
      'isFriendRequestSent',
      'isFriendRequestReceived',
      'id',
      'username',
      'email',
      'fullname',
      'dob',
      'phonenumber',
      'gender',
      'public',
      'complete',
      'userImages',
      'friendCount',
      'likeCount',
      'favoriteCount',
      'replyCount',
      'jitScore',
      'isBlocked',
    ]);
  });
  it('returns 404 when user is inactive', async () => {
    const user = await User.create({
      username: 'user1',
      email: 'user1@Mail.com',
      password: 'P4ssword',
      inactive: true,
    });

    const response = await getUser(user.id);
    expect(response.status).toBe(404);
  });
});

describe('Get me', () => {
  const getUser = async (options) => {
    let agent = request(app);
    let token;
    if (options.auth) {
      const response = await agent.post('/api/1.0/auth').send(options.auth);
      token = response.body.token;
    }

    agent = request(app).get('/api/1.0/users/me');
    if (token) {
      agent.set('Authorization', `Bearer ${token}`);
    }
    return agent.send();
  };
  it('returns id, username, fullname, email and dob in response body', async () => {
    const hash = await bcrypt.hash('P4ssword', 10);
    const user = await User.create({
      username: 'user1',
      email: 'user1@Mail.com',
      fullname: 'full name',
      password: hash,
      inactive: false,
      dob: '1999-02-23',
    });

    const response = await getUser({
      auth: { email: user.email, password: 'P4ssword' },
    });
    expect(Object.keys(response.body)).toEqual([
      'isFriend',
      'isFriendRequestSent',
      'isFriendRequestReceived',
      'id',
      'username',
      'email',
      'fullname',
      'dob',
      'phonenumber',
      'gender',
      'public',
      'complete',
      'userImages',
      'friendCount',
      'likeCount',
      'favoriteCount',
      'replyCount',
      'jitScore',
      'isBlocked',
    ]);
  });
});
