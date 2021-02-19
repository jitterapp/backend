const transporter = require('../config/emailTransporter');
const nodemailer = require('nodemailer');

const sendAccountActivation = async (email, token) => {
  const info = await transporter.sendMail({
    from: 'jitter@jitter.com',
    to: email,
    subject: 'Account Activation',
    html: `
    <div>
      <b>Please click link below to activate your account</b>
    </div>
    <div>
      <a href="http://localhost:8080/#/login?token=${token}">Activate</a>
    </div>
    `,
  });
  if (process.env.NODE_env === 'development') {
    console.log('url: ' + nodemailer.getTestMessageUrl(info));
  }
};

module.exports = {
  sendAccountActivation,
};
