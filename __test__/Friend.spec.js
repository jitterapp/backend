const request = require('supertest');
const app = require('../src/app');
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
const friendUser = {
  username: 'frienduser',
  fullname: 'friend name',
  email: 'friend@mail.com',
  password: 'P4ssword',
  inactive: false,
};
const otherUser = {
  username: 'otheruser',
  fullname: 'other name',
  email: 'other@mail.com',
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

const friendRequest = async (id = 5, options = {}) => {
  let agent = request(app).post('/api/1.0/friends/' + id);

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send();
};

const acceptFriendRequest = async (id = 5, options = {}) => {
  let agent = request(app).put('/api/1.0/friends/' + id);

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send();
};

const cancelFriend = async (id = 5, options = {}) => {
  let agent = request(app).delete('/api/1.0/friends/' + id);

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send();
};

const rejectFriend = async (id = 5, options = {}) => {
  let agent = request(app).delete('/api/1.0/friends/requests/received/' + id);

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send();
};

const cancelFriendRequest = async (id = 5, options = {}) => {
  let agent = request(app).delete('/api/1.0/friends/requests/sent/' + id);

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send();
};

const getFriends = async (options = {}) => {
  let agent = request(app).get('/api/1.0/friends');

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send();
};

const getFriendRequestsSent = async (options = {}) => {
  let agent = request(app).get('/api/1.0/friends/requests/sent');

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send();
};

const getFriendRequestsReceived = async (options = {}) => {
  let agent = request(app).get('/api/1.0/friends/requests/received');

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send();
};

describe('Friend Request', () => {
  it('returns forbidden when request is sent unauthorized', async () => {
    const response = await friendRequest();
    expect(response.status).toBe(403);
  });
  it('can not friend yourself', async () => {
    const savedUser = await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await friendRequest(savedUser.id, { token: token });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('can not friend yourself');
  });
  it('can not find user', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await friendRequest(1000, { token: token });
    const body = response.body;
    expect(response.status).toBe(400);
    expect(body.validationErrors.userId.message).toBe('User not found');
  });
  it('success friend request', async () => {
    await addUser();
    const friend = await addUser({ ...friendUser });
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await friendRequest(friend.id, { token: token });
    expect(response.status).toBe(200);
  });
  it('already sent friend request', async () => {
    await addUser();
    const friend = await addUser({ ...friendUser });
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    await friendRequest(friend.id, { token: token });
    const response = await friendRequest(friend.id, { token: token });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('already sent friend request');
  });
  it('can not find friend request', async () => {
    await addUser();
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const response = await acceptFriendRequest(5, { token: token });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('can not find friend request');
  });
  it('accepts friend request', async () => {
    const user = await addUser();
    const friend = await addUser({ ...friendUser });
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    await friendRequest(friend.id, { token: token });
    const friendToken = await auth({ auth: { email: friendUser.email, password: friendUser.password } });
    const response = await acceptFriendRequest(user.id, { token: friendToken });
    expect(response.status).toBe(200);
  });
  it('fails to cancel friend', async () => {
    await addUser();
    const friend = await addUser({ ...friendUser });
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const friendRequestResponse = await friendRequest(friend.id, { token: token });
    expect(friendRequestResponse.status).toBe(200);

    const response = await cancelFriend(friend.id, { token });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('can not find friend');
  });
  it('cancel friend', async () => {
    const user = await addUser();
    const friend = await addUser({ ...friendUser });
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const friendRequestResponse = await friendRequest(friend.id, { token: token });
    expect(friendRequestResponse.status).toBe(200);
    const friendToken = await auth({ auth: { email: friendUser.email, password: friendUser.password } });
    const acceptFriendRequestResponse = await acceptFriendRequest(user.id, { token: friendToken });
    expect(acceptFriendRequestResponse.status).toBe(200);

    const response = await cancelFriend(friend.id, { token });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('canceled friend');
  });
  it('reject friend request', async () => {
    const user = await addUser();
    const friend = await addUser({ ...friendUser });
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const friendRequestResponse = await friendRequest(friend.id, { token: token });
    expect(friendRequestResponse.status).toBe(200);
    const friendToken = await auth({ auth: { email: friendUser.email, password: friendUser.password } });

    const rejectFriendRequestResponse = await rejectFriend(user.id, { token: friendToken });
    expect(rejectFriendRequestResponse.status).toBe(200);
    expect(rejectFriendRequestResponse.body.message).toBe('rejected friend request');
  });
  it('fails to reject friend request', async () => {
    const other = await addUser({ ...otherUser });
    await addUser();
    const friend = await addUser({ ...friendUser });
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const friendRequestResponse = await friendRequest(friend.id, { token: token });
    expect(friendRequestResponse.status).toBe(200);
    const friendToken = await auth({ auth: { email: friendUser.email, password: friendUser.password } });

    const rejectFriendRequestResponse = await rejectFriend(other.id, { token: friendToken });
    expect(rejectFriendRequestResponse.status).toBe(400);
    expect(rejectFriendRequestResponse.body.message).toBe('failed to reject friend request');
  });
  it('cancel friend request', async () => {
    await addUser();
    const friend = await addUser({ ...friendUser });
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const friendRequestResponse = await friendRequest(friend.id, { token: token });
    expect(friendRequestResponse.status).toBe(200);

    const response = await cancelFriendRequest(friend.id, { token });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('canceled friend request');
  });
  it('fails to cancel friend request', async () => {
    const other = await addUser({ ...otherUser });
    await addUser();
    const friend = await addUser({ ...friendUser });
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const friendRequestResponse = await friendRequest(friend.id, { token: token });
    expect(friendRequestResponse.status).toBe(200);
    const friendToken = await auth({ auth: { email: friendUser.email, password: friendUser.password } });

    const response = await cancelFriendRequest(other.id, { token: friendToken });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('failed to cancel friend request');
  });
  it('get friends', async () => {
    const user = await addUser();
    const friend = await addUser({ ...friendUser });
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const friendRequestResponse = await friendRequest(friend.id, { token: token });
    expect(friendRequestResponse.status).toBe(200);
    const friendToken = await auth({ auth: { email: friendUser.email, password: friendUser.password } });
    const acceptFriendResponse = await acceptFriendRequest(user.id, { token: friendToken });
    expect(acceptFriendResponse.status).toBe(200);

    const response = await getFriends({ token });
    expect(response.status).toBe(200);
  });
  it('get friend requests sent', async () => {
    await addUser();
    const friend = await addUser({ ...friendUser });
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const friendRequestResponse = await friendRequest(friend.id, { token: token });
    expect(friendRequestResponse.status).toBe(200);

    const response = await getFriendRequestsSent({ token });
    expect(response.status).toBe(200);
  });
  it('get friend requests received', async () => {
    await addUser();
    const friend = await addUser({ ...friendUser });
    const token = await auth({ auth: { email: activeUser.email, password: activeUser.password } });
    const friendRequestResponse = await friendRequest(friend.id, { token: token });
    expect(friendRequestResponse.status).toBe(200);

    const friendToken = await auth({ auth: { email: friendUser.email, password: friendUser.password } });
    const response = await getFriendRequestsReceived({ token: friendToken });
    expect(response.status).toBe(200);
  });
});
