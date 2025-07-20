const express = require("express");
const router = express.Router();
const salaryController = require("./controller");
const { auth, isAdmin, authRole } = require("../middleware/auth");

router.route("/").get(auth, salaryController.getAllSalaries);

router.route("/").post(auth, salaryController.createSalary);

router
  .route("/:id/edit")
  .get(auth, salaryController.showEdit)
  .post(auth, salaryController.updateSalary);

router.route("/:id").delete(auth, salaryController.deleteSalary);

router.route("/report").get(auth, salaryController.report);

module.exports = router;
