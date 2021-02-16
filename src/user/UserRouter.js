const express = require('express');
const User = require('./user/User');
const bcrypt = require('bcrypt');
const router = express.Router();

router.post('/api/1.0/users', (req, res) => {
  const saltRounds = 10;
  bcrypt.hash(req.body.password, saltRounds).then((hash) => {
    const user = { ...req.body, password: hash };
    User.create(user).then(() => {
      return res.send({ message: 'User created' });
    });
  });
});
