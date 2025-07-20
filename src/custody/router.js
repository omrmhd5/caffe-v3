const express = require("express");
const router = express.Router();
const custodyController = require("./controller");
const { auth, isAdmin, authRole } = require("../middleware/auth");

router.route("/").get(auth, custodyController.getAllCustodies);

router
  .route("/add")
  .get(auth, custodyController.showAdd)
  .post(auth, custodyController.createCustody);

router
  .route("/:id/edit")
  .get(auth, custodyController.showEdit)
  .post(auth, custodyController.updateCustody);

router.route("/:id").delete(auth, custodyController.deleteCustody);

module.exports = router;
