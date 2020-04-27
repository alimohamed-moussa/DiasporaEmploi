const Job = require("../models/jobs");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const APIFilters = require("../utils/apiFilters");
const path = require("path");
const fs = require("fs");
const fileUpload = require("express-fileupload");
const sendEmail = require("../utils/sendEmail");

const geoCoder = require("../utils/geocoder");

// GET all jobs => /api/v1/jobs
exports.getJobs = catchAsyncErrors(async (req, res, next) => {
  const apiFilters = new APIFilters(Job.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .searchByQuery()
    .pagination();
  //Recherche de job
  const jobs = await apiFilters.query;

  res.status(200).json({
    success: true,
    results: jobs.length,
    data: jobs,
  });
});

//CREATE job => /api/v1/job/new
exports.newJob = catchAsyncErrors(async (req, res, next) => {
  //Ajout de USER
  req.body.user = req.user.id;
  const job = await Job.create(req.body);

  res.status(200).json({
    success: true,
    message: "L'offre a été ajouté avec succès.",
    data: job,
  });
});

//RECHERCHE job avec ID et SLUG  => /api/v1/job/:id/:slug
exports.getJob = catchAsyncErrors(async (req, res, next) => {
  const job = await Job.find({
    $and: [{ _id: req.params.id }, { slug: req.params.slug }],
  }).populate({
    path: "user",
    select: "name",
  });

  if (!job || job.length === 0) {
    return next(new errorHandler("Offre non trouvée.", 404));
  }

  res.status(200).json({
    success: true,
    data: job,
  });
});

//UPDATE job  => /api/v1/job/:id/
exports.updateJob = catchAsyncErrors(async (req, res, next) => {
  let job = await Job.findById(req.params.id);

  if (!job) {
    return next(new errorHandler("Offre non trouvé", 404));
  }

  //Check if user is owner
  if (job.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new errorHandler("L'utilisateur n'est pas autorisé à modifié cette offre")
    );
  }

  job = await Job.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    message: "L'offre a été modifiée avec succès.",
    data: job,
  });
});

//DELETE job =>/api/v1/job/:id
exports.deleteJob = catchAsyncErrors(async (req, res, next) => {
  //Retrouver l'offre
  let job = await Job.findById(req.params.id).select("+postulants");

  //Erreur si l'offre n'existe pas
  if (!job) {
    return next(new errorHandler("Offre non trouvé", 404));
  }

  //Check if user is owner
  if (job.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new errorHandler("L'utilisateur n'est pas autorisé à modifié cette offre")
    );
  }

  //Deleting files associated with the job

  for (let i = 0; i < job.postulants.length; i++) {
    let filepath = `${__dirname}/public/uploads/${job.postulants[i].cv}`.replace(
      "\\controllers",
      ""
    );

    let filepath2 = `${__dirname}/public/uploads/${job.postulants[i].lettre_motivation}`.replace(
      "\\controllers",
      ""
    );

    fs.unlink(filepath, (err) => {
      if (err) return console.log(err);
    });

    fs.unlink(filepath2, (err) => {
      if (err) return console.log(err);
    });
  }

  job = await Job.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "L'offre a été supprimée.",
  });
});

//RECHERCHE de job dans un rayon  => /api/v1/jobs/:zipcode/:distances
exports.getJobsInRadius = catchAsyncErrors(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  // Getting latitude & longitude from geocoder with zipcode
  const loc = await geoCoder.geocode(zipcode);
  const latitude = loc[0].latitude;
  const longitude = loc[0].longitude;

  const radius = distance / 3963;

  const jobs = await Job.find({
    location: {
      $geoWithin: { $centerSphere: [[longitude, latitude], radius] },
    },
  });

  res.status(200).json({
    success: true,
    results: jobs.length,
    data: jobs,
  });
});

//GET STATS about job(topic) => /api/v1/stats/:topic
exports.getStats = catchAsyncErrors(async (req, res, next) => {
  const stats = await Job.aggregate([
    {
      $match: { $text: { $search: '"' + req.params.topic + '"' } },
    },
    {
      $group: {
        __id: { $toUpper: "$experience" },
        totalJobs: { $sum: 1 },
        avgPosition: { $avg: "positions" },
        avgSalary: { $avg: "$salary" },
        minSalary: { $min: "$salary" },
        maxSalary: { $max: "$salary" },
      },
    },
  ]);

  if (stats.length === 0) {
    return next(
      new errorHandler(
        `Il n'ya pas de résultats pour la recherche - ${req.params.topic}`,
        200
      )
    );
    return res.status(200).json({
      success: false,
      message: `Il n'ya pas de résultats pour la recherche - ${req.params.topic}`,
    });
  }
  res.status(200).json({
    success: true,
    data: stats,
  });
});

// Apply to job using Resume  =>  /api/v1/job/:id/apply
exports.applyJob = catchAsyncErrors(async (req, res, next) => {
  //Rechercher le job
  let job = await Job.findById(req.params.id).select("+postulants titre email");

  //Vérifier que le job existe
  if (!job) {
    return next(new ErrorHandler("Offre non trouvé.", 404));
  }

  // Vérifier que la limite de candidature n'est pas dépassée
  if (job.deadline < new Date(Date.now())) {
    return next(
      new ErrorHandler("La date limite de candidature est dépassée.", 400)
    );
  }

  // Vérifier que le candidat n'a pas déjà postulé à l'offre
  for (let i = 0; i < job.postulants.length; i++) {
    if (job.postulants[i].id === req.user.id) {
      return next(
        new ErrorHandler("Vous avez déja postulé à cette offre.", 400)
      );
    }
  }

  const cv = req.files.cv;
  const lettre_motivation = req.files.lettre_motivation;

  // Vérification des fichiers CV car la lettre de motivation n'est pas obligatoire
  if (!cv) {
    return next(new ErrorHandler("Veuillez ajouter un fichier.", 400));
  }

  // Vérification du type de fichier CV
  const supportedFiles = /.doc|.docx|.pdf/;
  if (!supportedFiles.test(path.extname(cv.name))) {
    return next(
      new ErrorHandler(
        "Veuillez ajouter des fichiers au bon format, seuls les formats: .doc, .docx, .pdf sont autorisés",
        400
      )
    );
  }

  // Vérification du type de fichier Lettre de motivation
  const supportedFile = /.doc|.docx|.pdf/;
  if (!supportedFile.test(path.extname(lettre_motivation.name))) {
    return next(
      new ErrorHandler(
        "Veuillez ajouter des fichiers au bon format, seuls les formats: .doc, .docx, .pdf sont autorisés",
        400
      )
    );
  }

  // Vérification de la taille du fichier CV
  if (cv.size > process.env.MAX_FILE_SIZE) {
    return next(
      new ErrorHandler("La taille du fichier doit être inférieure à 4MB.", 400)
    );
  }

  // Vérification de la taille du fichier LETTRE_MOTIVATION
  if (lettre_motivation.size > process.env.MAX_FILE_SIZE) {
    return next(
      new ErrorHandler("La taille du fichier doit être inférieure à 4MB.", 400)
    );
  }

  // Renommer le cv
  cv.name = `CV_${req.user.name.replace(" ", "_")}_${job._id}${
    path.parse(cv.name).ext
  }`;

  // Renommer la lettre_motivation
  lettre_motivation.name = `lettre_${req.user.name.replace(" ", "_")}_${
    job._id
  }${path.parse(lettre_motivation.name).ext}`;

  cv.mv(`${process.env.UPLOAD_PATH}/${cv.name}`, async (err) => {
    if (err) {
      console.log(err);
      return next(new ErrorHandler("Echec de chargement du cv.", 500));
    }
  });
  lettre_motivation.mv(
    `${process.env.UPLOAD_PATH}/${lettre_motivation.name}`,
    async (err) => {
      if (err) {
        console.log(err);
        return next(
          new ErrorHandler(
            "Echec de chargement de la lettre de motivation.",
            500
          )
        );
      }
    }
  );
  await Job.findByIdAndUpdate(
    req.params.id,
    {
      $push: {
        postulants: {
          id: req.user.id,
          cv: cv.name,
          lettre: lettre_motivation.name,
        },
      },
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );
  //sendUserApplyMessage(req.user.email, req.user.name, job);
  const messageCandidat = `Bonjour ${req.user.name},\n\n Votre candidature pour le poste de ${job.titre} a bien été transmise au recruteur.\n\n Cordialement, \n\n L'équipe DiasporaEmploi`;

  const messageRecruteur = `Bonjour,\n\n ${req.user.name} vient de répondre à votre offre pour le poste de ${job.titre}.\n\n Cordialement, \n\n L'équipe DiasporaEmploi`;

  //Envoie du mail  aux recruteurs
  await sendEmail({
    email: job.email,
    subject: "Reception de nouvelle candidature - DiasporaEmploi",
    messageRecruteur,
  });

  //Envoie du mail aux candidats
  await sendEmail({
    email: req.user.email,
    subject: "Accusé de reception candidat - DiasporaEmploi",
    messageCandidat,
  });

  res.status(200).json({
    success: true,
    message: "Candidature envoyé avec success.",
    cv: cv.name,
    lettre: lettre_motivation.name,
  });
});
