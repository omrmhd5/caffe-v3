const express = require("express");
const router = express.Router();
const employeeController = require("./controller");
const { auth, isAdmin } = require("../middleware/auth");

router.route("/").get(auth, employeeController.getAllEmployees);

router
  .route("/add")
  .get(auth, employeeController.addEmployee)
  .post(auth, employeeController.createEmployee);

router
  .route("/:id/edit")
  .get(auth, isAdmin, employeeController.showEdit)
  .post(auth, isAdmin, employeeController.updateEmployee);

router.route("/:id").delete(auth, isAdmin, employeeController.deleteEmployee);

module.exports = router;
