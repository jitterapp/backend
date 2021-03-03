const crypto = require('crypto');

const randomString = (length) => {
  //convert bytes to hex format
  return crypto.randomBytes(length).toString('hex').substring(0, length);
};

module.exports = {
  randomString,
};
