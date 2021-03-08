const TokenService = require('../auth/TokenService');
const ForbiddenException = require('../error/ForbiddenException');

const tokenAuthentication = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (authorization) {
    const token = authorization.substring(7); //bearer + ' '
    try {
      const user = await TokenService.verify(token);
      if (!user) {
        return next(new ForbiddenException('Not authorized'));
      }
      req.authenticatedUser = user;
    } catch (error) {
      return next(new ForbiddenException('Not authorized'));
    }
  } else {
    return next(new ForbiddenException('Not authorized'));
  }
  next();
};

module.exports = tokenAuthentication;
