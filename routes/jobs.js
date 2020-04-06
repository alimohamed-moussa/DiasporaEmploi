const express = require("express");
const router = express.Router();

//Import du jobs controllers method

const {
  getJobs,
  newJob,
  getJobsInRadius,
  updateJob,
  deleteJob,
  getJob,
  getStats,
  applyJob,
} = require("../controllers/jobsController");

const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");

router.route("/jobs").get(getJobs);
router.route("/job/:id/:slug").get(getJob);
router.route("/jobs/:zipcode/:distance").get(getJobsInRadius);
router.route("/stats/:topic").get(getStats);

router
  .route("/job/:id/apply")
  .put(isAuthenticatedUser, authorizeRoles("user"), applyJob);
router
  .route("/job/new")
  .post(isAuthenticatedUser, authorizeRoles("employeur"), newJob);

router
  .route("/job/:id")
  .put(isAuthenticatedUser, authorizeRoles("employeur", "admin"), updateJob)
  .delete(isAuthenticatedUser, authorizeRoles("employeur", "admin"), deleteJob);

module.exports = router;
