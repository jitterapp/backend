const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');
const sequelize = require('../src/config/database');
const bcryt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const credentials = { email: 'user1@mail.com', password: 'P4ssword' };

beforeAll(async () => {
  await sequelize.sync();
});

beforeEach(async () => {
  await User.destroy({ truncate: { cascade: true } }); //clean user table before each test
});

const activeUser = { username: 'user1', email: 'user1@mail.com', password: 'P4ssword', inactive: false };

const readFileAsBase64 = (file = 'test-png.png') => {
  const filePath = path.join('.', '__test__', 'resources', file);
  return fs.readFileSync(filePath, { encoding: 'base64' });
};

const addUser = async (user = { ...activeUser }) => {
  const hash = await bcryt.hash(user.password, 10);
  user.password = hash;
  return await User.create(user);
};

const putUser = async (id = 5, body = null, options = {}) => {
  let agent = request(app);
  let token;
  if (options.auth) {
    const response = await agent.post('/api/1.0/auth').send(options.auth);
    token = response.body.token;
  }

  agent = request(app).put('/api/1.0/users/' + id);
  if (token) {
    agent.set('Authorization', `Bearer ${token}`);
  }
  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send(body);
};

const updatePassword = async (body = null, options = {}) => {
  let agent = request(app);
  let token;
  if (options.auth) {
    const response = await agent.post('/api/1.0/auth').send(options.auth);
    token = response.body.token;
  }

  agent = request(app).put('/api/1.0/users/password');
  if (token) {
    agent.set('Authorization', `Bearer ${token}`);
  }
  if (options.token) {
    agent.set('Authorization', `Bearer ${token}`);
  }
  return agent.send(body);
};

describe('User update', () => {
  it('returns forbidden when request sent without basic authentication', async () => {
    const response = await putUser();
    expect(response.status).toBe(403);
  });
  it('returns error body with a message when authroization fails', async () => {
    const nowInMillis = new Date().getTime();
    const response = await putUser();
    expect(response.body.path).toBe('/api/1.0/users/5');
    expect(response.body.timestamp).toBeGreaterThan(nowInMillis);
    expect(response.body.message).toBe('Not authorized');
  });
  it('returns forbidden when request is sent with incorrect email in basic authorization', async () => {
    await addUser();
    const response = await putUser(5, null, { auth: { email: 'wrongemail', password: 'P4ssword' } });
    expect(response.status).toBe(403);
  });
  it('returns forbidden when request is sent with incorrect password in basic authorization', async () => {
    await addUser();
    const response = await putUser(5, null, { auth: { email: 'user1@mail.com', password: 'wrong' } });
    expect(response.status).toBe(403);
  });
  it('returns forbidden when update request is sent with correct credentials for different user ', async () => {
    await addUser();
    const userToBeUpdated = await addUser({ ...activeUser, username: 'user2', email: 'user2@mail.com' });
    const response = await putUser(userToBeUpdated.id, null, {
      auth: { email: 'user1@mail.com', password: 'P4ssword' },
    });
    expect(response.status).toBe(403);
  });
  it('returns forbidden when update request is sent by inactive user with correct credentials for its own user', async () => {
    const inactiveUser = await addUser({ ...activeUser, inactive: true });
    const response = await putUser(inactiveUser.id, null, {
      auth: credentials,
    });
    expect(response.status).toBe(403);
  });
  it('returns 200 ok when valid update request sent from authorized user', async () => {
    const savedUser = await addUser();
    const validUpdate = { username: 'user1-updated' };
    const response = await putUser(savedUser.id, validUpdate, {
      auth: { email: savedUser.email, password: 'P4ssword' },
    });
    expect(response.status).toBe(200);
  });
  it('updates username in database when valid update request is sent from authorized user', async () => {
    const savedUser = await addUser();
    const validUpdate = { username: 'user1-updated' };
    await putUser(savedUser.id, validUpdate, {
      auth: { email: savedUser.email, password: 'P4ssword' },
    });
    const inDBUser = await User.findOne({ where: { id: savedUser.id } });
    expect(inDBUser.username).toBe(validUpdate.username);
  });
  it('returns 403 when token is not valid', async () => {
    const response = await putUser(5, null, { token: '123' });
    expect(response.status).toBe(403);
  });
  it('updates username and fullname in database when valid update request is sent from authorized user', async () => {
    const savedUser = await addUser();
    const validUpdate = { username: 'user1-updated', fullname: 'updated fullname' };
    await putUser(savedUser.id, validUpdate, {
      auth: { email: savedUser.email, password: 'P4ssword' },
    });
    const inDBUser = await User.findOne({ where: { id: savedUser.id } });
    expect(inDBUser.username).toBe(validUpdate.username);
    expect(inDBUser.fullname).toBe(validUpdate.fullname);
  });
  it('updates username, fullname, dob in database when valid update request is sent from authorized user', async () => {
    const savedUser = await addUser();
    const validUpdate = { username: 'user1-updated', fullname: 'updated fullname', dob: '1999-02-25' };
    const response = await putUser(savedUser.id, validUpdate, {
      auth: { email: savedUser.email, password: 'P4ssword' },
    });
    const inDBUser = await User.findOne({ where: { id: savedUser.id } });
    expect(inDBUser.username).toBe(validUpdate.username);
    expect(inDBUser.fullname).toBe(validUpdate.fullname);
    expect(inDBUser.dob).toString(`${validUpdate.dob}T00:00:00.000Z`);
    expect(response.status).toBe(200);
  });
  it('fails to update fullname', async () => {
    const savedUser = await addUser();
    const validUpdate = { fullname: 't' };
    const response = await putUser(savedUser.id, validUpdate, {
      auth: { email: savedUser.email, password: 'P4ssword' },
    });
    const body = response.body;
    expect(body.validationErrors.fullname).toBe('Must have min 4 and max 32 characters');
    expect(response.status).toBe(400);
  });
  it('fails to update dob', async () => {
    const savedUser = await addUser();
    const invalidUpdate = { dob: '1992-02-33' };
    const response = await putUser(savedUser.id, invalidUpdate, {
      auth: { email: savedUser.email, password: 'P4ssword' },
    });
    const body = response.body;
    expect(body.validationErrors.dob).toBe('Invalid value');
    expect(response.status).toBe(400);
  });
  it('fails to update phonenumber', async () => {
    const savedUser = await addUser();
    const invalidUpdate = { phonenumber: '615-274-55555' };
    const response = await putUser(savedUser.id, invalidUpdate, {
      auth: { email: savedUser.email, password: 'P4ssword' },
    });
    const body = response.body;
    expect(body.validationErrors.phonenumber).toBe('phonenumber is invalid');
    expect(response.status).toBe(400);
  });
});
describe('User update password', () => {
  it('returns forbidden when request sent without authentication', async () => {
    const response = await updatePassword();
    expect(response.status).toBe(403);
  });
  it('fails to update password without new password', async () => {
    const user = await addUser();
    const response = await updatePassword(
      { oldPassword: 'P4ssword' },
      { auth: { email: user.email, password: 'P4ssword' } }
    );
    expect(response.status).toBe(400);
    const body = response.body;
    expect(body.validationErrors.newPassword).toBe('New Password cannot be null');
  });
  it('fails to update password without old password', async () => {
    const user = await addUser();
    const response = await updatePassword(
      { newPassword: 'newPassword1' },
      { auth: { email: user.email, password: 'P4ssword' } }
    );
    expect(response.status).toBe(400);
    const body = response.body;
    expect(body.validationErrors.oldPassword).toBe('Old Password cannot be null');
  });
  it('fails to update password with mismatching old password', async () => {
    const user = await addUser();
    const response = await updatePassword(
      { oldPassword: 'P4ssword1', newPassword: 'newPassword1' },
      { auth: { email: user.email, password: 'P4ssword' } }
    );
    expect(response.status).toBe(400);
    const body = response.body;
    expect(body.message).toBe('Old password is incorrect');
  });
  it('success to update password', async () => {
    const user = await addUser();
    const response = await updatePassword(
      { oldPassword: 'P4ssword', newPassword: 'newPassword1' },
      { auth: { email: user.email, password: 'P4ssword' } }
    );
    expect(response.status).toBe(200);
    const body = response.body;
    expect(body.message).toBe('Password updated');
  });
  it('saves the user image when upate contains as image as base64', async () => {
    const fileInBase64 = readFileAsBase64();
    const savedUser = await addUser();
    const validUpdate = { username: 'user1-updated', image: fileInBase64 };
    await putUser(savedUser.id, validUpdate, {
      auth: { email: savedUser.email, password: 'P4ssword' },
    });
    const inDBUser = await User.findOne({ where: { id: savedUser.id } });
    expect(inDBUser.image).toBeTruthy();
  });
});
