const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');
const sequelize = require('../src/config/database');
const SMTPServer = require('smtp-server').SMTPServer;

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

  it('it saves the username, fullname, dob and email to the database', async () => {
    await postUser();
    const userList = await User.findAll();
    const savedUser = userList[0];
    expect(savedUser.username).toBe('user1');
    expect(savedUser.email).toBe('user1@mail.com');
    expect(savedUser.fullname).toBe('full name');
    expect(savedUser.dob).toString('1999-12-22T00:00:00.000Z');
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
      dob: '1999-12-22',
    });
    expect(response.status).toBe(400);
  });
  it('returns validation errors field in response body when error occurs', async () => {
    const response = await postUser({
      username: null,
      email: 'user1@mail.com',
      password: 'P4ssword',
      dob: '1999-12-22',
    });
    const body = response.body;
    expect(body.validationErrors).not.toBeUndefined();
  });
  it('returns username cannot be null when username is null', async () => {
    const response = await postUser({
      username: null,
      email: 'user1@mail.com',
      password: 'P4ssword',
      fullname: 'full name',
      dob: '1999-12-22',
    });
    const body = response.body;
    expect(body.validationErrors.username).toBe('Username cannot be null');
  });
  it('returns email cannot be null when email is null', async () => {
    const response = await postUser({
      username: 'user1',
      email: null,
      password: 'P4ssword',
      dob: '1999-12-22',
      fullname: 'full name',
    });
    const body = response.body;
    expect(body.validationErrors.email).toBe('Email cannot be null');
  });
  it('returns fullname cannot be null when fullname is null', async () => {
    const response = await postUser({
      username: 'user1',
      email: 'user1@mail.com',
      password: 'P4ssword',
      dob: '1999-12-22',
      fullname: null,
    });
    const body = response.body;
    expect(body.validationErrors.fullname).toBe('Fullname cannot be null');
  });
  it('returns dob Invalid value when dob is null', async () => {
    const response = await postUser({
      username: 'user1',
      email: 'user1@mail.com',
      password: 'P4ssword',
      dob: null,
      fullname: 'full name',
    });
    const body = response.body;
    expect(body.validationErrors.dob).toBe('Invalid value');
  });
  it('returns dob Invalid value when dob is invalid format', async () => {
    const response = await postUser({
      username: 'user1',
      email: 'user1@mail.com',
      password: 'P4ssword',
      dob: '19990223',
      fullname: 'full name',
    });
    const body = response.body;
    expect(body.validationErrors.dob).toBe('Invalid value');
  });
  it('returns errors for both when username and email is null', async () => {
    const response = await postUser({
      username: null,
      email: null,
      password: 'P4ssword',
      fullname: null,
      dob: '1999-12-22',
    });

    /*
      validationErrors ={
        username: '...',
        email: '...'
      }
    */

    const body = response.body;
    expect(Object.keys(body.validationErrors)).toEqual(['username', 'fullname', 'email']);
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
      fullname: 'full name',
    };
    user[field] = value;
    const response = await postUser(user);
    const body = response.body;
    expect(body.validationErrors[field]).toBe(expectedMessage);
  });

  it('returns email in use when same email is already in use', async () => {
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
      fullname: 'full name',
      dob: '1999-12-22',
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
    const users = await User.findAll();
    const savedUser = users[0];
    expect(lastMail).toContain('user1@mail.com');
    expect(lastMail).toContain(savedUser.activationToken);
  });
  it('returns 502 bad gateway and email failure message when sending email fails', async () => {
    simulateSMTPFailure = true;
    const response = await postUser();
    expect(response.status).toBe(502);
    expect(response.body.message).toBe('E-mail Failure');
  });
  it('does not save user to database if activation email fails', async () => {
    simulateSMTPFailure = true;
    await postUser();
    const users = await User.findAll();
    expect(users.length).toBe(0);
  });
});

describe('Account activation', () => {
  it('it activates the account when the correct token is sent', async () => {
    await postUser();
    let users = await User.findAll();
    const token = users[0].activationToken;

    await request(app)
      .get('/api/1.0/users/token/' + token)
      .send();
    users = await User.findAll();
    expect(users[0].inactive).toBe(false);
  });

  it('removes the token from user table after successful activation', async () => {
    await postUser();
    let users = await User.findAll();
    const token = users[0].activationToken;

    await request(app)
      .get('/api/1.0/users/token/' + token)
      .send();
    users = await User.findAll();
    expect(users[0].activationToken).toBeFalsy();
  });
  it('does not activate the account when token is wrong', async () => {
    await postUser();
    let users = await User.findAll();
    const token = 'this-token-does-not-exist';

    await request(app)
      .get('/api/1.0/users/token/' + token)
      .send();
    users = await User.findAll();
    expect(users[0].inactive).toBe(true);
  });
  it('returns bad request when the token is wrong', async () => {
    await postUser();
    const token = 'this-token-does-not-exist';
    const response = await request(app)
      .get('/api/1.0/users/token/' + token)
      .send();
    expect(response.status).toBe(400);
  });
  it('returns message when wrong token is sent', async () => {
    await postUser();
    const token = 'this-token-does-not-exist';
    const response = await request(app)
      .get('/api/1.0/users/token/' + token)
      .send();
    expect(response.body.message).toBe('This account is either active or the token is invalid');
  });
  it('returns validations failure message in error response body when registration fails', async () => {
    const response = await postUser({
      username: null,
      email: 'invalidUser@mail.com',
      password: 'P4ssword',
      fullname: 'full name',
    });
    expect(response.body.message).toBe('Validation failure');
  });
});

describe('Error model', () => {
  it('returns path, timestamp, message, and validationErrors in response when validation fails', async () => {
    const response = await postUser({
      ...validUser,
      username: null,
    });
    const body = response.body;
    expect(Object.keys(body)).toEqual(['path', 'timestamp', 'message', 'validationErrors']);
  });
  it('returns path, timestamp, and message in response when request fails other than validation error', async () => {
    const token = 'this-token-does-not-exist';
    const response = await request(app)
      .get('/api/1.0/users/token/' + token)
      .send();
    const body = response.body;
    expect(Object.keys(body)).toEqual(['path', 'timestamp', 'message']);
  });
  it('returns path in error body', async () => {
    const token = 'this-token-does-not-exist';
    const response = await request(app)
      .get('/api/1.0/users/token/' + token)
      .send();
    const body = response.body;
    expect(body.path).toEqual('/api/1.0/users/token/' + token);
  });
  it('returns timestamp in milliseconds within 5 seconds in error body', async () => {
    const nowInMillis = new Date().getTime();
    const fiveSecondsLater = nowInMillis + 5 * 1000;
    const token = 'this-token-does-not-exist';
    const response = await request(app)
      .get('/api/1.0/users/token/' + token)
      .send();
    const body = response.body;
    expect(body.timestamp).toBeGreaterThan(nowInMillis);
    expect(body.timestamp).toBeLessThan(fiveSecondsLater);
  });
});
