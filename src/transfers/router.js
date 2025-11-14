const express = require("express");
const router = express.Router();
const transfersController = require("./controller");
const { auth } = require("../middleware/auth");

router.route("/").get(auth, transfersController.getAll);

module.exports = router;
