const request = require('supertest');
const app = require('../src/app');

describe('User Registration', () => {
  it('returns 200 when signup request is valid', (done) => {
    request(app)
      .post('/api/1.0/users')
      .send({
        username: 'user1',
        email: 'user1@mail.com',
        password: 'Password',
      })
      .then((response) => {
        expect(response.status).toBe(200);
        done();
      });
  });

  it('returns success message when the signup request is valid', (done) => {
    request(app)
      .post('/api/1.0/users')
      .send({
        username: 'user1',
        email: 'user1@mail.com',
        password: 'Password',
      })
      .then((response) => {
        expect(response.body.message).toBe('User created');
        done();
      });
  });
});
