const express = require("express");
const router = express.Router();
const salesController = require("./controller");
const { auth, authRole } = require("../middleware/auth");

router.route("/").get(auth, authRole("Manager"), salesController.getAllSales);

router
  .route("/add")
  .get(auth, salesController.addSales)
  .post(auth, salesController.createMultipleSales);

router
  .route("/:id/edit")
  .get(auth, salesController.showEdit)
  .post(auth, salesController.updateSales);

router.route("/:id").delete(auth, salesController.deleteSails);
router.route("/report").get(auth, salesController.report);
router.route("/monthlyReport").get(auth, salesController.monthlyReport);

module.exports = router;
