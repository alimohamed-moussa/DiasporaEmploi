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
    text: `Bonjour et bienvenue sur DiasporaEmploi ${name}.\n\n Toute notre équipe est à votre disposition, consulter le site et poster vos annonces ou postuler aux différentes offres disponibles.`,
  });
};

const sendDeleteAccountMessage = (email, name) => {
  sgMail.send({
    to: email,
    from: "alimohamed.moussa@gmail.com",
    subject: "Suppression sur DiasporaEmploi",
    text: `${name}, Votre compte sur DiasporaEmploi vient d'être supprimé.`,
  });
};

const sendUserApplyMessage = (email, name, job) => {
  sgMail.send({
    to: email,
    from: "alimohamed.moussa@gmail.com",
    subject: "Accusé de reception candidat - DiasporaEmploi",
    text: `${name}, Votre candidature pour le poste de ${job.titre} a bien été transmise au recruteur.`,
  });
};

const sendEmployeurNotificationsMessage = (email, name, job) => {
  sgMail.send({
    to: email,
    from: "alimohamed.moussa@gmail.com",
    subject: "Reception de candidature - DiasporaEmploi",
    text: `Bonjour,\n\n ${name} vient de transmettre sa candidature pour le poste de ${job.titre}.`,
  });
};

module.exports = {
  sendWelcomeMessage,
  sendDeleteAccountMessage,
  sendUserApplyMessage,
  sendEmployeurNotificationsMessage,
};
