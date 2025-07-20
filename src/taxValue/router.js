const express = require("express");
const router = express.Router();
const taxValueController = require("./controller");
const { auth } = require("../middleware/auth");

router.route("/").post(auth, taxValueController.addTaxValue);

module.exports = router;
