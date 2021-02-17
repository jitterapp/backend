const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');
const sequelize = require('../src/config/database');

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
  it.each`
    field         | value              | expectedMessage
    ${`username`} | ${null}            | ${`Username cannot be null`}
    ${`username`} | ${'usr'}           | ${`Must have min 4 and max 32 characters`}
    ${`username`} | ${'a'.repeat(33)}  | ${`Must have min 4 and max 32 characters`}
    ${`email`}    | ${null}            | ${`Email cannot be null`}
    ${`email`}    | ${'mail.com'}      | ${`Email is not valid`}
    ${`email`}    | ${'user@mail'}     | ${`Email is not valid`}
    ${`password`} | ${null}            | ${`Password cannot be null`}
    ${`password`} | ${'P4'}            | ${`Password must be at least 6 characters`}
    ${`password`} | ${'alllowercase'}  | ${`Password must have at least one lowercase letter, one uppercase, and 1 number`}
    ${`password`} | ${'ALLUPPERCASE'}  | ${`Password must have at least one lowercase letter, one uppercase, and 1 number`}
    ${`password`} | ${'1234567'}       | ${`Password must have at least one lowercase letter, one uppercase, and 1 number`}
    ${`password`} | ${'UPPERandlower'} | ${`Password must have at least one lowercase letter, one uppercase, and 1 number`}
    ${`password`} | ${'UPPER1234'}     | ${`Password must have at least one lowercase letter, one uppercase, and 1 number`}
    ${`password`} | ${'lower1234'}     | ${`Password must have at least one lowercase letter, one uppercase, and 1 number`}
  `('returns $expectedMessage when $field is $value', async ({ field, expectedMessage, value }) => {
    const user = {
      username: 'user1',
      email: 'user@mail.com',
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
});
