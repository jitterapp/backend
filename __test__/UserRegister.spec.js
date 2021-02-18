const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');
const sequelize = require('../src/config/database');
const nodemailerstub = require('nodemailer-stub');
const EmailService = require('../src/email/EmailService');

beforeAll(() => {
  return sequelize.sync();
});

beforeEach(() => {
  return User.destroy({ truncate: true }); //clean user table before each test
});

const validUser = {
  username: 'user1',
  email: 'user1@mail.com',
  password: 'P4ssword',
};

const postUser = (user = validUser) => {
  return request(app).post('/api/1.0/users').send(user);
};

describe('User Registration', () => {
  it('returns 200 when signup request is valid', async () => {
    const response = await postUser();
    expect(response.status).toBe(200);
  });

  it('returns success message when the signup request is valid', async () => {
    const response = await postUser();
    expect(response.body.message).toBe('User created');
  });

  it('saves the user to the database', async () => {
    await postUser();
    const userList = await User.findAll();
    expect(userList.length).toBe(1);
  });

  it('it saves the username and email to the database', async () => {
    await postUser();
    const userList = await User.findAll();
    const savedUser = userList[0];
    expect(savedUser.username).toBe('user1');
    expect(savedUser.email).toBe('user1@mail.com');
  });

  it('hashes the pasword in database', async () => {
    await postUser();
    const userList = await User.findAll();
    const savedUser = userList[0];
    expect(savedUser.password).not.toBe('P4ssword');
  });

  it('returns 400 when username is null', async () => {
    const response = await postUser({
      username: null,
      email: 'user1@mail.com',
      password: 'P4ssword',
    });
    expect(response.status).toBe(400);
  });
  it('returns validation errors field in response body when error occurs', async () => {
    const response = await postUser({
      username: null,
      email: 'user1@mail.com',
      password: 'P4ssword',
    });
    const body = response.body;
    expect(body.validationErrors).not.toBeUndefined();
  });
  it('returns username cannot be null when username is null', async () => {
    const response = await postUser({
      username: null,
      email: 'user1@mail.com',
      password: 'P4ssword',
    });
    const body = response.body;
    expect(body.validationErrors.username).toBe('Username cannot be null');
  });
  it('returns email cannot be null when email is null', async () => {
    const response = await postUser({
      username: 'user1',
      email: null,
      password: 'P4ssword',
    });
    const body = response.body;
    expect(body.validationErrors.email).toBe('Email cannot be null');
  });
  it('returns errors for both when username and email is null', async () => {
    const response = await postUser({
      username: null,
      email: null,
      password: 'P4ssword',
    });

    /*
      validationErrors ={
        username: '...',
        email: '...'
      }
    */

    const body = response.body;
    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
  });
  const username_null = 'Username cannot be null';
  const username_size = `Must have min 4 and max 32 characters`;
  const email_null = `Email cannot be null`;
  const email_invalid = 'Email is not valid';
  const password_null = `Password cannot be null`;
  const password_size = `Password must be at least 6 characters`;
  const password_pattern = `Password must have at least one lowercase letter, one uppercase, and 1 number`;
  it.each`
    field         | value              | expectedMessage
    ${`username`} | ${null}            | ${username_null}
    ${`username`} | ${'usr'}           | ${username_size}
    ${`username`} | ${'a'.repeat(33)}  | ${username_size}
    ${`email`}    | ${null}            | ${email_null}
    ${`email`}    | ${'mail.com'}      | ${email_invalid}
    ${`email`}    | ${'user@mail'}     | ${email_invalid}
    ${`password`} | ${null}            | ${password_null}
    ${`password`} | ${'P4'}            | ${password_size}
    ${`password`} | ${'alllowercase'}  | ${password_pattern}
    ${`password`} | ${'ALLUPPERCASE'}  | ${password_pattern}
    ${`password`} | ${'1234567'}       | ${password_pattern}
    ${`password`} | ${'UPPERandlower'} | ${password_pattern}
    ${`password`} | ${'UPPER1234'}     | ${password_pattern}
    ${`password`} | ${'lower1234'}     | ${password_pattern}
  `('returns $expectedMessage when $field is $value', async ({ field, expectedMessage, value }) => {
    const user = {
      username: 'user1',
      email: 'user1@mail.com',
      password: 'P4ssword',
    };
    user[field] = value;
    const response = await postUser(user);
    const body = response.body;
    expect(body.validationErrors[field]).toBe(expectedMessage);
  });

  it('returns email in use then same email is already in use', async () => {
    await User.create({ ...validUser });
    const response = await postUser();
    expect(response.body.validationErrors.email).toBe('email is already in use');
  });
  it('returns errors for both username is null and email is in use', async () => {
    await User.create({ ...validUser });
    const user = {
      username: null,
      email: validUser.email,
      password: 'P4ssword',
    };
    const response = await postUser(user);
    const body = response.body;
    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
  });
  it('creates a user in inactive mode', async () => {
    await postUser();
    const users = await User.findAll();
    const savedUser = users[0];
    expect(savedUser.inactive).toBe(true);
  });
  it('creates users in inactive mode even when the request body contains inactive as false', async () => {
    const newUser = { ...validUser, inactive: false };
    await postUser(newUser);
    const users = await User.findAll();
    const savedUser = users[0];
    expect(savedUser.inactive).toBe(true);
  });
  it('creates an activation token for user', async () => {
    const newUser = { ...validUser, inactive: false };
    await postUser(newUser);
    const users = await User.findAll();
    const savedUser = users[0];
    expect(savedUser.activationToken).toBeTruthy();
  });
  it('sends an account activation email with activation token', async () => {
    await postUser();
    const lastMail = nodemailerstub.interactsWithMail.lastMail();
    expect(lastMail.to[0]).toBe('user1@mail.com');
    const users = await User.findAll();
    const savedUser = users[0];
    expect(lastMail.content).toContain(savedUser.activationToken);
  });
  it('returns 502 bad gateway and email failure message when sending email fails', async () => {
    const mockAccountActivation = jest
      .spyOn(EmailService, 'sendAccountActivation')
      .mockRejectedValue({ message: 'Failed to deliver email' });
    const response = await postUser();
    expect(response.status).toBe(502);
    expect(response.body.message).toBe('E-mail Failure');
    mockAccountActivation.mockRestore();
  });
  it('does not save user to database if activation email fails', async () => {
    const mockAccountActivation = jest
      .spyOn(EmailService, 'sendAccountActivation')
      .mockRejectedValue({ message: 'Failed to deliver email' });
    await postUser();
    const users = await User.findAll();
    expect(users.length).toBe(0);
    mockAccountActivation.mockRestore();
  });
});
