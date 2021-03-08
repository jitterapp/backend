const User = require('../user/User');

const friendRequest = async (userId, friendId) => {
  const user = await User.findByPk(userId);
  try {
    const result = await user.addRequestees(friendId);
    return result;
  } catch (error) {
    console.log(error);
  }
};

module.exports = { friendRequest };
