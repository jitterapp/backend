const User = require('../user/User');

const friendRequest = async (userId, friendId) => {
  const user = await User.findByPk(userId);
  const result = await user.addRequestees(friendId);
  return result;
};

module.exports = { friendRequest };
