const express = require("express");
const router = express.Router();
const paymentValueController = require("./controller");
const { auth } = require("../middleware/auth");

router.route("/").post(auth, paymentValueController.addPaymentValue);
router.route("/").get(auth, paymentValueController.getPaymentValue);

module.exports = router;
