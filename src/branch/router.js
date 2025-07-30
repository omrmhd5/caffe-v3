const express = require("express");
const router = express.Router();
const branchController = require("./controller");
const { auth, isSuperAdmin } = require("../middleware/auth");

router.route("/").get(auth, isSuperAdmin, branchController.getAllBranches);

router
  .route("/add")
  .get(auth, isSuperAdmin, branchController.addBranch)
  .post(auth, isSuperAdmin, branchController.createBranch);

router
  .route("/:id/edit")
  .get(auth, isSuperAdmin, branchController.showEdit)
  .post(auth, isSuperAdmin, branchController.updateBranch);

router.post("/:id/hide", auth, isSuperAdmin, branchController.hideBranch);
router.post("/:id/unhide", auth, isSuperAdmin, branchController.unhideBranch);
router.post(
  "/:id/rent",
  auth,
  isSuperAdmin,
  branchController.updateRentHistory
);
router.post(
  "/:id/mada-ratio",
  auth,
  isSuperAdmin,
  branchController.updateMadaRatioHistory
);

module.exports = router;
