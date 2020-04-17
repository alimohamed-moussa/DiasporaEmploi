//Send email to users with sendGrid

// using Twilio SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const sendMail = (email, subject, content) => {
  sgMail.send({
    to: email,
    from: "alimohamed.moussa@gmail.com",
    subject: subject,
    text: content,
  });
};

module.exports = sendMail;
