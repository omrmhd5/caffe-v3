const express = require("express");
const router = express.Router();
const dailyIncomeController = require("./controller");
const { auth } = require("../middleware/auth");

router
  .route("/")
  .get(auth, dailyIncomeController.report)
  .post(auth, dailyIncomeController.addDailyIncome);

router.post("/notes", auth, dailyIncomeController.saveNotes);

module.exports = router;
