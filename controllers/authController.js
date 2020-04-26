const User = require("../models/users.js");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors.js");
const errorHandler = require("../utils/errorHandler");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

//Ajout d'un nouveau user  => /api/v1/register
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  const user = await User.create({ name, email, password, role });

  //Envoie de mail de creation de compte
  //sendWelcomeMessage(user.email, user.name);

  //Creation d'un JWT token
  sendToken(user, 200, res);
});

//Login user => /api/v1/Login
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  //Vérification la saisie des champs email and password
  if (!email || !password) {
    return next(
      new errorHandler("Veuillez entrer votre email et mot de passe"),
      400
    );
  }

  //Rechercher l'user dans la base de données
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new errorHandler("Email ou Mot de passe invalide.", 401));
  }

  //Vérification du mot de passe
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new errorHandler("Email ou Mot de passe invalide.", 401));
  }

  //Creation d'un JSON WEB TOKEN
  sendToken(user, 200, res);
});

//OUBLIE MOT DE PASSE => /api/v1/password/forgot
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  //Identification du USER
  const user = await User.findOne({ email: req.body.email });

  //Vérification de l'existance de l'Email dans la base de données
  if (!user) {
    return next(
      new errorHandler("Il n'existe d'utilisateur avec cet email.", 404)
    );
  }

  //GET Reset TOKEN (Récuperation du token de réinitialisation du mot de passe)
  const resetToken = user.getResetPasswordToken();

  //Enregister le user
  await user.save({ validateBeforeSave: false });

  //Creation de l'URL de reinitialisation du mot de passe
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/password/reset/${resetToken}`;

  //Message de reinitialisation du mot de passe (a envoyer par email à l'utilisateur)
  const message = `Veuillez cliquer sur le lien ci-dessous pour reinitialiser votre mot de passe: \n\n${resetUrl}`;

  try {
    //Envoie du mail
    await sendEmail({
      email: user.email,
      subject: "DiasporaEmploi - Récupération de mot de passe",
      message,
    });

    //Message de success
    res.status(200).json({
      success: true,
      message: `Email envoyé à : ${user.email}`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new errorHandler("Email n'a pas pu être envoyé."), 500);
  }
});

//REINITIALISATION MOT DE PASSE => /api/v1/password/reset/:token
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  //Hash url token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordToken: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new errorHandler(
        "Token de reinitialisation du mot de passe est invalide ou expiré.",
        400
      )
    );
  }

  //Setup new password
  user.password = req.body.password;

  //Supprimer les tokens de reinitialisation du mot de passe dans la base de données
  user.resetPassswordToken = undefined;
  user.resetPassswordExpire = undefined;

  //Enregister les modifications de l'utilisateur (mot de passe)
  await user.save();

  //Sauvegarde du token dans un cookie

  sendToken(user, 200, res);
});

//Logout user =>/api/v1/users/logout
exports.logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Deconnexion.",
  });
});
