const express = require('express');
const UserRouter = require('./user/UserRouter');
const app = express();
const errorHandler = require('./error/ErrorHandler');

app.use(express.json());

app.use(UserRouter);

app.use(errorHandler);

console.log(`env: running in ${process.env.NODE_ENV} mode`);

module.exports = app;
