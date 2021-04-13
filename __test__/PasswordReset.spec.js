const request = require('supertest');
const app = require('../src/app');
const db = require('../db/models');
const sequelize = db.sequelize;
const User = db.user;
const SMTPServer = require('smtp-server').SMTPServer;
const bcryt = require('bcrypt');

let lastMail, server;
let simulateSMTPFailure = false;

beforeAll(async () => {
  server = new SMTPServer({
    authOptional: true,
    onData(stream, session, callback) {
      let mailBody;
      stream.on('data', (data) => {
        mailBody += data.toString();
      }),
        stream.on('end', () => {
          if (simulateSMTPFailure) {
            const err = new Error('invalid mailbox');
            err.responseCode = 553;
            return callback(err);
          }
          lastMail = mailBody;
          callback();
        });
    },
  });
  await server.listen(8587, 'localhost');
  await sequelize.sync();
  jest.setTimeout(20000);
});

afterAll(async () => {
  await server.close();
  jest.setTimeout(5000);
});

beforeEach(async () => {
  simulateSMTPFailure = false;
  await User.destroy({ truncate: { cascade: true } }); //clean user table before each test
});

const validUser = {
  username: 'user1',
  email: 'user1@mail.com',
  password: 'P4ssword',
  dob: '1999-12-22',
  fullname: 'full name',
  phonenumber: '6152748283',
  gender: 1,
  inactive: false,
};

const sendResetPassword = (email) => {
  return request(app).post('/api/1.0/password/reset').send({ email });
};

const updatePassword = (token, password = '') => {
  return request(app).put('/api/1.0/password/reset').send({ token, password });
};

const addUser = async (user = { ...validUser }) => {
  const hash = await bcryt.hash(user.password, 10);
  user.password = hash;
  return await User.create(user);
};

describe('Send Password Reset Link', () => {
  it('failure without email', async () => {
    const response = await sendResetPassword();
    const body = response.body;
    expect(body.validationErrors.email).toBe('Email can not be null');
    expect(response.status).toBe(400);
  });
  it('failure with not registered email', async () => {
    const response = await sendResetPassword('test@test.com');
    const body = response.body;
    expect(body.validationErrors.email).toBe('email is not registered');
    expect(response.status).toBe(400);
  });
  it('success to send reset password link', async () => {
    await addUser();
    const response = await sendResetPassword(validUser.email);
    const body = response.body;
    expect(response.status).toBe(200);
    const user = await User.findOne({
      where: {
        email: validUser.email,
      },
    });
    expect(user.activationToken).toBeTruthy();
    expect(body.email).toBe(validUser.email);
    expect(lastMail).toContain(validUser.email);
    expect(lastMail).toContain(user.activationToken);
  });
});

describe('Reset Password', () => {
  it('failure without token', async () => {
    const response = await updatePassword();
    const body = response.body;
    expect(body.validationErrors.token).toBe('token is required');
    expect(response.status).toBe(400);
  });
  it('failure without password', async () => {
    const response = await updatePassword('token');
    const body = response.body;
    expect(body.validationErrors.password).toBe('Password cannot be null');
    expect(response.status).toBe(400);
  });
  it('failure with invalid password', async () => {
    const response = await updatePassword('token', 'password');
    const body = response.body;
    expect(body.validationErrors.password).toBe(
      'Password must have at least one lowercase letter, one uppercase, and 1 number'
    );
    expect(response.status).toBe(400);
  });
  it('failure with invalid token', async () => {
    const response = await updatePassword('token', 'Password1');
    const body = response.body;
    expect(body.message).toBe('user not found');
    expect(response.status).toBe(400);
  });
  it('success update password', async () => {
    await addUser();
    const response = await sendResetPassword(validUser.email);
    expect(response.status).toBe(200);
    const user = await User.findOne({
      where: {
        email: validUser.email,
      },
    });
    expect(user.activationToken).toBeTruthy();

    const password = 'Password123';
    const updatePasswordResponse = await updatePassword(user.activationToken, password);
    expect(updatePasswordResponse.status).toBe(200);
    expect(updatePasswordResponse.body.email).toBe(user.email);
    const updatedUser = await User.findOne({
      where: {
        email: validUser.email,
      },
    });
    const match = await bcryt.compare(password, updatedUser.password);
    expect(match).toBe(true);
  });
});
