//Send email to users with sendGrid

// using Twilio SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs
const sgMail = require("@sendgrid/mail");

const sendMail = async (email, subject, content) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    to: email,
    from: "support@diaspoemploi.fr",
    subject: subject,
    text: content,
  };
  sgMail.send(msg);
};

module.exports = sendMail;
