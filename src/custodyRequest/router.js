const express = require("express");
const router = express.Router();
const requestController = require("./controller");
const { auth } = require("../middleware/auth");

router.route("/").get(auth, requestController.getAllRequests);

router.route("/status").get(auth, requestController.getAllRequestsStatus);

router
  .route("/add")
  .get(auth, requestController.showAdd)
  .post(auth, requestController.createRequest);

router
  .route("/:id/edit")
  .get(auth, requestController.showEdit)
  .post(auth, requestController.updateRequest);

router.route("/:id").delete(auth, requestController.deleteRequest);

router.route("/:id/accept").post(auth, requestController.acceptRequest);
router.route("/:id/reject").post(auth, requestController.rejectRequest);

module.exports = router;
