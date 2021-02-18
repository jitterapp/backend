const nodemailer = require('nodemailer');
const nodemailerstub = require('nodemailer-stub');
const transporter = nodemailer.createTransport(nodemailerstub.stubTransport);

module.exports = transporter;
