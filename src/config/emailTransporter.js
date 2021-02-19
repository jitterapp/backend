const nodemailer = require('nodemailer');
const config = require('config');

const mailConig = config.get('mail');

const transporter = nodemailer.createTransport({ ...mailConig });

module.exports = transporter;
