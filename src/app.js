const express = require('express');
const UserRouter = require('./user/UserRouter');
const app = express();

app.use(express.json());

app.use(UserRouter);

console.log(`env: running in ${process.env.NODE_ENV} mode`);

module.exports = app;
