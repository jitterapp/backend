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
      <a href="http://localhost:8080/#/login?token=${token}">Activate</a>
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
};
