const express = require("express");
const router = express.Router();
const transfersController = require("./controller");
const { auth } = require("../middleware/auth");

router.route("/").get(auth, transfersController.getAll).post(auth, transfersController.addTransfers);
router.route("/:id").delete(auth, transfersController.deleteTransfer);

module.exports = router;
