const express = require("express");
const router = express.Router();
const storeController = require("./controller");
const { auth, isAdmin, authRole } = require("../middleware/auth");

router.route("/").get(auth, storeController.viewSroreData);
router.route("/").post(auth, storeController.updateBoughtQuantityAjax);
router.route("/reset/:id").post(auth, storeController.resetStore);

router
  .route("/report")
  .get(auth, authRole("Manager"), storeController.getSroreReport);

router
  .route("/:id/edit")
  .get(auth, storeController.showEdit)
  .post(auth, storeController.updateBoughtQuantity);

module.exports = router;
