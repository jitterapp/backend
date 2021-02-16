const express = require('express');
const User = require('./User');
const bcrypt = require('bcrypt');
const router = express.Router();

router.post('/api/1.0/users', async (req, res) => {
  const saltRounds = 10;
  const hash = await bcrypt.hash(req.body.password, saltRounds);
  const user = { ...req.body, password: hash };
  await User.create(user);
  return res.send({ message: 'User created' });
});

module.exports = router;
