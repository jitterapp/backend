const request = require('supertest');
const mock = require('mock-fs');
const app = require('../src/app');
const User = require('../src/user/User');
const sequelize = require('../src/config/database');
const bcrypt = require('bcrypt');
const { existsSync } = require('fs');

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
const otherUser = {
  username: 'frienduser',
  fullname: 'friend name',
  email: 'friend@mail.com',
  password: 'P4ssword',
  inactive: false,
};

const addUser = async (user = { ...activeUser }) => {
  const hash = await bcrypt.hash(user.password, 10);
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

const postImage = async (image = '', options = {}) => {
  let agent = request(app).post('/api/1.0/users/images');

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.attach('image', image, 'profile.png');
};

const getImages = async (options = {}) => {
  let agent = request(app).get('/api/1.0/users/images');

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send();
};

const deleteImage = async (id, options = {}) => {
  let agent = request(app).delete(`/api/1.0/users/images/${id}`);

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send();
};

const updateImage = async (id, image = '', options = {}) => {
  let agent = request(app).put(`/api/1.0/users/images/${id}`);

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.attach('image', image, 'profile.png');
};

describe('Post Image', () => {
  it('returns forbidden when request is sent unauthorized', async () => {
    const response = await postImage();
    expect(response.status).toBe(403);
  });
  it('fails to post image without resource attached', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await postImage('', { token });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('image is required');
  });
  it('fails to post image with large file', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const size = 1024 * 1024 * 11;
    mock({
      'profile.png': Buffer.from('a '.repeat(size).split(' ')),
      uploads: {},
    });
    expect(existsSync('profile.png')).toBeTruthy();
    const response = await postImage('profile.png', { token });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('File too large');
  });
  it('success to post image', async () => {
    const user = await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const size = 100;
    mock({
      'profile.png': Buffer.from('a '.repeat(size).split(' ')),
      uploads: {},
    });
    expect(existsSync('profile.png')).toBeTruthy();
    const response = await postImage('profile.png', { token });
    expect(response.status).toBe(200);
    expect(response.body.userId).toBe(user.id);
  });
});

describe('Get Images', () => {
  it('returns forbidden when request is sent unauthorized', async () => {
    const response = await getImages();
    expect(response.status).toBe(403);
  });
  it('success to get images', async () => {
    const user = await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const size = 100;
    mock({
      'profile.png': Buffer.from('a '.repeat(size).split(' ')),
      uploads: {},
    });
    expect(existsSync('profile.png')).toBeTruthy();
    const response = await postImage('profile.png', { token });
    expect(response.status).toBe(200);
    expect(response.body.userId).toBe(user.id);

    const getImagesResponse = await getImages({ token });
    expect(getImagesResponse.status).toBe(200);
    expect(getImagesResponse.body.length).toBe(1);
  });
});

describe('Delete Image', () => {
  it('returns forbidden when request is sent unauthorized', async () => {
    const response = await deleteImage(1);
    expect(response.status).toBe(403);
  });
  it('fails to delete image', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await deleteImage(1, { token });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('can not find image');
  });
  it('fails to delete other user image', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const size = 100;
    mock({
      'profile.png': Buffer.from('a '.repeat(size).split(' ')),
      uploads: {},
    });
    expect(existsSync('profile.png')).toBeTruthy();
    const response = await postImage('profile.png', { token });
    expect(response.status).toBe(200);

    await addUser({ ...otherUser });
    const otherToken = await auth({ auth: { email: otherUser.email, password: 'P4ssword' } });
    const deleteResponse = await deleteImage(response.body.id, { token: otherToken });
    expect(deleteResponse.status).toBe(400);
    expect(deleteResponse.body.message).toBe('can not delete image');
  });
  it('success to delete user image', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const size = 100;
    mock({
      'profile.png': Buffer.from('a '.repeat(size).split(' ')),
      uploads: {},
    });
    expect(existsSync('profile.png')).toBeTruthy();
    const response = await postImage('profile.png', { token });
    expect(response.status).toBe(200);

    const deleteResponse = await deleteImage(response.body.id, { token });
    expect(deleteResponse.status).toBe(200);

    const getImagesResponse = await getImages({ token });
    expect(getImagesResponse.status).toBe(200);
    expect(getImagesResponse.body.length).toBe(0);
  });
});

describe('Update Image', () => {
  it('returns forbidden when request is sent unauthorized', async () => {
    const response = await updateImage(1);
    expect(response.status).toBe(403);
  });
  it('fails to update image', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const size = 100;
    mock({
      'profile.png': Buffer.from('a '.repeat(size).split(' ')),
      uploads: {},
    });
    const response = await updateImage(1, 'profile.png', { token });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('can not find image');
  });
  it('fails to update other user image', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const size = 100;
    mock({
      'profile.png': Buffer.from('a '.repeat(size).split(' ')),
      uploads: {},
    });
    expect(existsSync('profile.png')).toBeTruthy();
    const response = await postImage('profile.png', { token });
    expect(response.status).toBe(200);

    await addUser({ ...otherUser });
    const otherToken = await auth({ auth: { email: otherUser.email, password: 'P4ssword' } });
    const updateResponse = await updateImage(response.body.id, 'profile.png', { token: otherToken });
    expect(updateResponse.status).toBe(400);
    expect(updateResponse.body.message).toBe('can not edit image');
  });
  it('fails to upload large image', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const size = 1024;
    mock({
      'profile.png': Buffer.from('a '.repeat(size).split(' ')),
      uploads: {},
    });
    expect(existsSync('profile.png')).toBeTruthy();
    const response = await postImage('profile.png', { token });
    expect(response.status).toBe(200);

    mock({
      'profile_large.png': Buffer.from('a '.repeat(size * 1024 * 11).split(' ')),
      uploads: {},
    });
    const updateResponse = await updateImage(response.body.id, 'profile_large.png', { token });
    expect(updateResponse.status).toBe(400);
    expect(updateResponse.body.message).toBe('File too large');
  });
  it('success to update user image', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const size = 100;
    mock({
      'profile.png': Buffer.from('a '.repeat(size).split(' ')),
      uploads: {},
    });
    expect(existsSync('profile.png')).toBeTruthy();
    const response = await postImage('profile.png', { token });
    expect(response.status).toBe(200);

    const updateResponse = await updateImage(response.body.id, 'profile.png', { token });
    expect(updateResponse.status).toBe(200);

    const getImagesResponse = await getImages({ token });
    expect(getImagesResponse.status).toBe(200);
    expect(getImagesResponse.body.length).toBe(1);
  });
});
