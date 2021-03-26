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

describe('Activity', () => {
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
