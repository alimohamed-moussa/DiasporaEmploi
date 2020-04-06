const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Veuillez saisir votre nom."]
    },
    email: {
      type: String,
      required: [true, "Veuillez saisir une adresse email correct."],
      unique: true,
      validate: [
        validator.isEmail,
        "Veuillez saisir une adresse email correct."
      ]
    },
    role: {
      type: String,
      enum: {
        values: ["user", "employeur"],
        message: "Veuillez selectionner un role."
      },
      default: "user"
    },
    password: {
      type: String,
      required: [true, "Veuillez saisir un mot de passe."],
      minLength: [8, "Le mot de passe doit contenir au moins 8 caractères."],
      select: false
    },
    dateCreation: {
      type: Date,
      default: Date.now()
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

//Cryptage du mot de passe
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

//Retourne web token
userSchema.methods.getJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_TIME
  });
};

//Comparaison du mot de passe de l'utilisateur avec celui de la base de données
userSchema.methods.comparePassword = async function(enterPassword) {
  return await bcrypt.compare(enterPassword, this.password);
};

//Password Reset token
userSchema.methods.getResetPasswordToken = function() {
  //Creation de token
  const resetToken = crypto.randomBytes(20).toString("hex");

  //Hash and set to resetPasswordToken
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  //Set Token expire time
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000;

  return resetToken;
};

//Show all jobs created by the user with virtuals
userSchema.virtual("jobsPublished", {
  ref: "Job",
  localField: "_id",
  foreignField: "user",
  justOne: false
});

module.exports = mongoose.model("User", userSchema);
