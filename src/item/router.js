const express = require("express");
const router = express.Router();
const itemController = require("./controller");
const { auth, isAdmin, authRole } = require("../middleware/auth");

router.route("/").get(auth, authRole("Manager"), itemController.getAllItems);

router
  .route("/add")
  .get(auth, itemController.showAdd)
  .post(auth, itemController.createItem);

router
  .route("/:id/edit")
  .get(auth, itemController.showEdit)
  .post(auth, itemController.updateItem);

router.route("/:id").delete(auth, itemController.deleteItem);

module.exports = router;
