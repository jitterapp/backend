const express = require('express');
const UserRouter = require('./user/UserRouter');
const app = express();
const errorHandler = require('./error/ErrorHandler');
const AuthticationRouter = require('./auth/AuthenticationRouter');
const FriendRouter = require('./friend/FriendRouter');
const JitRouter = require('./jit/JitRouter');
const StoryRouter = require('./story/StoryRouter');

app.use(express.json());

app.use(UserRouter);
app.use(AuthticationRouter);
app.use(FriendRouter);
app.use(JitRouter);
app.use(StoryRouter);

app.use(errorHandler);

console.log(`env: running in ${process.env.NODE_ENV} mode`);

module.exports = app;
