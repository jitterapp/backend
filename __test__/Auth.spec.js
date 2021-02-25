const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');
const sequelize = require('../src/config/database');
const bcryt = require('bcrypt');

beforeAll(async () => {
  await sequelize.sync();
});

beforeEach(() => {
  return User.destroy({ truncate: true }); //clean user table before each test
});

const addUser = async () => {
  const user = { username: 'user1', email: 'user1@mail.com', password: 'P4ssword', inactive: false };
  const hash = await bcryt.hash(user.password, 10);
  user.password = hash;
  await User.create(user);
};

const postAuthentication = async (credentials) => {
  return await request(app).post('/api/1.0/auth').send(credentials);
};

describe('Listing users', () => {
  it('returns 200 ok when credentials are correct', async () => {
    await addUser();
    await postAuthentication({ email: 'user1@mail.com', password: 'P4ssword' });
  });
});
