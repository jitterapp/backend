const TokenService = require('../auth/TokenService');

const tokenAuthentication = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (authorization) {
    const token = authorization.substring(7); //bearer + ' '
    try {
      const user = await TokenService.verify(token);
      req.authenticatedUser = user;
      console.log(req.authenticatedUser, 'hi');
      // eslint-disable-next-line no-empty
    } catch (error) {}
  }
  next();
};

module.exports = tokenAuthentication;
