const User = require("../models/users.js");
const Job = require("../models/jobs");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors.js");
const errorHandler = require("../utils/errorHandler");
const sendToken = require("../utils/jwtToken");
const fs = require("fs");
const APIFilters = require("../utils/apiFilters");

//Get user profile => /api/v1/me
exports.getUserProfile = catchAsyncErrors(async (req, res, next) => {
  //Get user
  const user = await User.findById(req.user.id).populate({
    path: "jobsPublished",
    select: "titre datePublication",
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

//Update user password =>/api/v1/password/update
//Need to provide the current password and new password
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
  //Get the user password
  const user = await User.findById(req.user.id).select("+password");

  //Check previous password (in the Database)
  const isMatched = await user.comparePassword(req.body.currentPassword);

  if (!isMatched) {
    return next(new errorHandler(" Le mot de passe est incorrect.", 401));
  }

  //Save the new password (provide new password)
  user.password = req.body.newPassword;

  await user.save();

  sendToken(user, 200, res);
});

//UPDATE current user data =>/api/v1/me/update
//User can only changee his email and name
exports.updateUser = catchAsyncErrors(async (req, res, next) => {
  //User new data
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  };

  //Updating the user data with new data
  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  //Sending response and user new data
  res.status(200).json({
    success: true,
    data: user,
  });
});

// Show all applied jobs   =>   /api/v1/jobs/applied
//Liste des offres d'emploi auxquelles le candidat à postuler
exports.getAppliedJobs = catchAsyncErrors(async (req, res, next) => {
  //Find all applied jobs by the user
  const jobs = await Job.find({ "postulants.id": req.user.id }).select(
    "+postulants"
  );

  //Send the response
  res.status(200).json({
    success: true,
    results: jobs.length,
    data: jobs,
  });
});

//Show all the jobs published by the current employeer => /api/v1/jobs/published
//Liste des offres d'emploi publiées par un employeur
exports.getPublishedJobs = catchAsyncErrors(async (req, res, next) => {
  const jobs = await Job.find({ user: req.user.id });

  res.status(200).json({
    success: true,
    results: jobs.length,
    data: jobs,
  });
});

//DELETE current user => /api/v1/me/delete
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
  //Delete all data of the user
  deleteUserData(req.user.id, req.user.role);

  const user = await User.findByIdAndDelete(req.user.id);

  //Cancel the token
  res.cookie("token", "none", {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  //Send the response
  res.status(200).json({
    success: true,
    message: "Votre compte a bien été supprimé.",
  });
});

//Adding controller methods only accessible by admins

//Show all users => /api/v1/users
exports.getUsers = catchAsyncErrors(async (req, res, next) => {
  const apiFilters = new APIFilters(User.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .pagination();

  const users = await apiFilters.query;

  res.status(200).json({
    success: true,
    results: users.length,
    data: users,
  });
});

//Delete Users (ADMIN) => /api/v1/user/:id

exports.deleteUserAdmin = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHandler(
        `Aucun utilisateur trouvé avec cet id : ${req.params.id}`,
        404
      )
    );
  }

  deleteUserData(user.id, user.role);
  await user.remove();

  res.status(200).json({
    success: true,
    message: "Utilisateur supprimé par l'Admin.",
  });
});

//Delete User Data
async function deleteUserData(user, role) {
  if (role === "employeur") {
    await Job.deleteMany({ user: user });
  }

  if (role === "user") {
    const appliedJobs = await Job.find({ "postulants.id": user }).select(
      "+postulants"
    );

    for (let i = 0; i < appliedJobs.length; i++) {
      let obj = appliedJobs[i].postulants.find((o) => o.id === user);

      let filepath = `${__dirname}/public/uploads/${obj.resume}`.replace(
        "\\controllers",
        ""
      );

      fs.unlink(filepath, (err) => {
        if (err) return console.log(err);
      });

      appliedJobs[i].postulants.splice(
        appliedJobs[i].postulants.indexOf(obj.id)
      );

      await appliedJobs[i].save();
    }
  }
}
