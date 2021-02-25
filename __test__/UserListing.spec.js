const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');
const sequelize = require('../src/config/database');

beforeAll(async () => {
  await sequelize.sync();
});

beforeEach(() => {
  return User.destroy({ truncate: true }); //clean user table before each test
});

const getUsers = () => {
  return request(app).get('/api/1.0/users');
};

const addUsers = async (activeUserCount, inactiveUserCount = 0) => {
  for (let i = 0; i < activeUserCount + inactiveUserCount; i++) {
    await User.create({
      username: `user${i + 1}`,
      email: `user${i + 1}@mail.com`,
      inactive: i >= activeUserCount,
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
  it('returns only id, username, and email in content array for each user', async () => {
    await addUsers(6, 5);
    const response = await getUsers();
    const user = response.body.content[0];
    expect(Object.keys(user)).toEqual(['id', 'username', 'email']);
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
});
