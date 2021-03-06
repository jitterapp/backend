const apiBase = process.env.API_BASE;
const transporter = require('../config/emailTransporter');
const nodemailer = require('nodemailer');

const sendAccountActivation = async (email, token) => {
  const mailOptions = await transporter.sendMail({
    from: 'lawrence.nicastro1@gmail.com',
    to: email,
    subject: 'Account Activation',
    html: `
    <div>
      <b>Please click link below to activate your account</b>
    </div>
    <div>
      <a href="${apiBase}/accountActivate.html?token=${token}">Activate</a>
    </div>
    `,
  });
  // if (process.env.NODE_ENV === 'development') {
  //   console.log('url: ' + nodemailer.getTestMessageUrl(info));
  // }
  if (process.env.NODE_ENV === 'production') {
    return 'url: ' + nodemailer.getTestMessageUrl(mailOptions);
  }
};

const sendPasswordReset = async (email, token) => {
  const mailOptions = await transporter.sendMail({
    from: 'lawrence.nicastro1@gmail.com',
    to: email,
    subject: 'Reset your password',
    html: `
    <div>
      <b>Please click link below to reset your password</b>
    </div>
    <div>
      <a href="${apiBase}/reset.html?token=${token}">Reset</a>
    </div>
    `,
  });
  // if (process.env.NODE_ENV === 'development') {
  //   console.log('url: ' + nodemailer.getTestMessageUrl(info));
  // }
  if (process.env.NODE_ENV === 'production') {
    return 'url: ' + nodemailer.getTestMessageUrl(mailOptions);
  }
};

module.exports = {
  sendAccountActivation,
  sendPasswordReset,
};
