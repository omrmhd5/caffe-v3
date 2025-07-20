const express = require("express");
const router = express.Router();
const financialController = require("./controller");
const { auth, isAdmin } = require("../middleware/auth");

router
  .route("/")
  .get(auth, financialController.getAllFinancials)
  .patch(auth, financialController.updateFinancials);

router.route("/report").get(auth, financialController.report);

router
  .route("/add")
  .get(auth, financialController.showAdd)
  .post(auth, financialController.createFinancials);

router.route("/comments").patch(auth, financialController.updateComments);
module.exports = router;
