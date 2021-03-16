// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  const { status, message, errors } = err;
  let validationErrors;
  if (errors) {
    validationErrors = {};
    errors.forEach((error) => (validationErrors[error.param] = error.msg));
  }

  const statusToSend = status || 400;
  const messageToSend = message || 'Error';
  res
    .status(statusToSend)
    .send({ path: req.originalUrl, timestamp: new Date().getTime(), message: messageToSend, validationErrors });
};
