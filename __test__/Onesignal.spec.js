const request = require('supertest');
const app = require('../src/app');
const OneSignalService = require('../src/onesignal/OneSignalService');
const bcryt = require('bcrypt');
const db = require('../db/models');
const sequelize = db.sequelize;
const User = db.user;

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

const registerOneSignalUserId = async (onesignalUserId = '', options = {}) => {
  let agent = request(app).post('/api/1.0/onesignal');

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send({ onesignalUserId });
};

const removeOneSignalUserId = async (onesignalUserId = '', options = {}) => {
  let agent = request(app).delete('/api/1.0/onesignal');

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send({ onesignalUserId });
};

describe('Register OneSignal UserId', () => {
  it('returns forbidden when request is sent unauthorized', async () => {
    const response = await registerOneSignalUserId();
    expect(response.status).toBe(403);
  });
  it('fails to register without onesignal user id', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await registerOneSignalUserId('', { token });
    expect(response.status).toBe(400);
    expect(response.body.validationErrors.onesignalUserId).toBe('cannot be null');
  });
  it('fails to register duplicated onesignal user id', async () => {
    const testOnesignalUserId = '1111';
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await registerOneSignalUserId(testOnesignalUserId, { token });
    expect(response.status).toBe(200);
    const failedResponse = await registerOneSignalUserId(testOnesignalUserId, { token });
    expect(failedResponse.status).toBe(400);
    expect(failedResponse.body.message).toBe('already registered');
  });
  it('success to register onesignal user id', async () => {
    const testOnesignalUserId = '1111';
    const user = await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await registerOneSignalUserId(testOnesignalUserId, { token });
    expect(response.status).toBe(200);
    expect(response.body.userId).toBe(user.id);
    expect(response.body.onesignalUserId).toBe(testOnesignalUserId);
  });
});

describe('Remove OneSignal UserId', () => {
  it('returns forbidden when request is sent unauthorized', async () => {
    const response = await removeOneSignalUserId();
    expect(response.status).toBe(403);
  });
  it('fails to remove without onesignal user id', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await removeOneSignalUserId('', { token });
    expect(response.status).toBe(400);
    expect(response.body.validationErrors.onesignalUserId).toBe('cannot be null');
  });
  it('success to remove onesignal user id', async () => {
    const testOnesignalUserId = '1111';
    const user = await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await registerOneSignalUserId(testOnesignalUserId, { token });
    expect(response.status).toBe(200);

    const removeResponse = await removeOneSignalUserId(testOnesignalUserId, { token });
    expect(removeResponse.status).toBe(200);
    const onesignal = await OneSignalService.findOnesignalUserId(user.id, testOnesignalUserId);
    expect(onesignal).toBe(null);
  });
});
