const request = require('supertest');
const app = require('../src/app');
const bcryt = require('bcrypt');
const db = require('../db/models');
const sequelize = db.sequelize;
const User = db.user;
const Token = db.token;

beforeAll(async () => {
  await sequelize.sync();
});

beforeEach(async () => {
  await User.destroy({ truncate: { cascade: true } }); //clean user table before each test
});

const activeUser = { username: 'user1', email: 'user1@mail.com', password: 'P4ssword', inactive: false };

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

const deleteUser = async (id = 5, options = {}) => {
  let agent = request(app).delete('/api/1.0/users/' + id);

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send();
};

describe('User delete', () => {
  it('returns forbidden when request is sent unauthorized', async () => {
    const response = await deleteUser();
    expect(response.status).toBe(403);
  });
  it('returns error body with a message when auth fails', async () => {
    const nowInMillis = new Date().getTime();
    const response = await deleteUser(5);
    expect(response.body.path).toBe('/api/1.0/users/5');
    expect(response.body.timestamp).toBeGreaterThan(nowInMillis);
    expect(response.body.message).toBe('Not authorized');
  });

  it('returns forbidden when delete request is sent with correct credentials for different user ', async () => {
    await addUser();
    const userToBeDeleted = await addUser({ ...activeUser, username: 'user2', email: 'user2@mail.com' });
    const token = await auth({ auth: { email: 'user1@mail.com', password: 'P4ssword' } });
    const response = await deleteUser(userToBeDeleted.id, { token: token });
    expect(response.status).toBe(403);
  });
  it('returns 403 when token is not valid', async () => {
    const response = await deleteUser(5, { token: '123' });
    expect(response.status).toBe(403);
  });

  it('returns 200 ok when valid delete request sent from authorized user', async () => {
    const savedUser = await addUser();
    const token = await auth({ auth: { email: 'user1@mail.com', password: 'P4ssword' } });
    const response = await deleteUser(savedUser.id, { token: token });
    expect(response.status).toBe(200);
  });
  it('deletes user in database when req is sent from authorized user', async () => {
    const savedUser = await addUser();
    const token = await auth({ auth: { email: 'user1@mail.com', password: 'P4ssword' } });
    await deleteUser(savedUser.id, { token: token });

    const inDBUser = await User.findOne({ where: { id: savedUser.id } });
    expect(inDBUser).toBeNull();
  });
  it('deletes token from database when delete user request comes from authorized user', async () => {
    const savedUser = await addUser();
    const token = await auth({ auth: { email: 'user1@mail.com', password: 'P4ssword' } });
    await deleteUser(savedUser.id, { token: token });

    const tokenInDb = await Token.findOne({ where: { token: token } });

    expect(tokenInDb).toBeNull();
  });
  it('deletes all tokens from database when delete user request comes from authorized user', async () => {
    const savedUser = await addUser();
    const token1 = await auth({ auth: { email: 'user1@mail.com', password: 'P4ssword' } }); //token that will be deleted to cancel user session
    const token2 = await auth({ auth: { email: 'user1@mail.com', password: 'P4ssword' } }); // token that will be sent to authorize deleting user session
    await deleteUser(savedUser.id, { token: token1 });

    const tokenInDb = await Token.findOne({ where: { token: token2 } });

    expect(tokenInDb).toBeNull();
  });
});
