//Send email to users with sendGrid

// using Twilio SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeMessage = (email, name) => {
  sgMail.send({
    to: email,
    from: "alimohamed.moussa@gmail.com",
    subject: "Bienvenue sur DiasporaEmploi",
    text: `Bonjour et bienvenue sur DiasporaEmploi ${name}.\n\n Toute notre équipe est à votre disposition, consulter le site et poster vos annonces.`,
  });
};

module.exports = { sendWelcomeMessage };
