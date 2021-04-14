const nodemailer = require('nodemailer');

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, TEST_SMTP_PORT, TEST_SMTP_HOST, NODE_ENV } = process.env;

let mailConig;
if (NODE_ENV === 'test') {
  mailConig = {
    host: TEST_SMTP_HOST,
    port: TEST_SMTP_PORT,
    tls: {
      rejectUnauthorized: false,
    },
  };
} else {
  mailConig = {
    host: SMTP_HOST,
    port: SMTP_PORT,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  };
}

const transporter = nodemailer.createTransport({ ...mailConig });

module.exports = transporter;
