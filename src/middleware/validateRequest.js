const { validationResult } = require('express-validator');
const ValidationException = require('../error/ValidationException');

const validateRequest = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ValidationException(errors.array()));
  }
  next();
};

module.exports = validateRequest;
