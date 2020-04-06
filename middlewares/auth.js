const jwt = require("jsonwebtoken");
const User = require("../models/users");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const errorHandler = require("../utils/errorHandler");

//Verifier si l'user est authentifié ou pas
exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
  let token;

  //Vérification de l'existance du token dans la requete
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    //Extraction du TOKEN sans le mot clé "Bearer"
    token = req.headers.authorization.split(" ")[1];
  }

  //Si le TOKEN n'existe pas
  if (!token) {
    return next(
      new errorHandler(
        "Veuillez vous connecter afin d'acceder à ce contenu.",
        401
      )
    );
  }

  //Décryption du TOKEN
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded.id);

  next();
});

//GESTION DES ROLES
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new errorHandler(
          `Role ${req.user.role} n'est pas authorisé à acceder à ce contenu.`,
          403
        )
      );
    }
    next();
  };
};
