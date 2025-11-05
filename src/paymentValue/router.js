const express = require("express");
const router = express.Router();
const paymentValueController = require("./controller");
const { auth } = require("../middleware/auth");

router.route("/").post(auth, paymentValueController.addPaymentValue);
router.route("/").get(auth, paymentValueController.getPaymentValue);
router.post("/approve", auth, paymentValueController.approvePaymentValue);
router.post("/reject", auth, paymentValueController.rejectPaymentValue);
router.post("/approve-field", auth, paymentValueController.approvePaymentField);
router.post("/reject-field", auth, paymentValueController.rejectPaymentField);

module.exports = router;
