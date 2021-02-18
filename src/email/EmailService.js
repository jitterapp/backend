const nodemailer = require('nodemailer');
const nodemailerstub = require('nodemailer-stub');
const transporter = nodemailer.createTransport(nodemailerstub.stubTransport);

const sendAccountActivation = async (email, token) => {
  await transporter.sendMail({
    from: 'jitter@jitter.com',
    to: email,
    subject: 'Account Activation',
    html: `Token is ${token}`,
  });
};

module.exports = {
  sendAccountActivation,
};
