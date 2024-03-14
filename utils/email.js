const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText =require('html-to-text');
const { getMaxListeners } = require('../models/tourModel');


module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Akshit Bhadani <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'development') {
      // Sendgrid
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'akshitbhadani2003@gmail.com',
          pass: 'ixolgylqwztodbpk'
        }
      });
    }
  }

  // Send the actual email
  async send(template, subject) {
    // 1) Render HTML based on a pug template${__dirname}/../views/email/${template}.pug
    const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject
    });

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text:htmlToText.fromString(html)
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)'
    );
  }
};
