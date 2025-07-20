const express = require("express");
const router = express.Router();
const userController = require("./controller");
const { auth, isAdmin, isSuperAdmin } = require("../middleware/auth");

router.route("/").get(auth, userController.getAllUsers);
// .post(userController.createUser);

router
  .route("/add")
  .get(auth, isAdmin, userController.addUser)
  .post(auth, isAdmin, userController.createUser);

router
  .route("/addAdmin")
  .get(auth, isSuperAdmin, userController.addAdmin)
  .post(auth, isSuperAdmin, userController.createAdmin);

router
  .route("/:id/edit")
  .get(auth, isAdmin, userController.showEdit)
  .post(auth, isAdmin, userController.updateUser);

router.route("/:id/block").post(auth, isAdmin, userController.blockUser);

router
  .route("/login")
  .get(userController.showLogin)
  .post(userController.loginUser);

router.route("/logout").get(auth, userController.logout);

router
  .route("/changePassword")
  .get(auth, userController.showChangePassword)
  .post(auth, userController.changePassword);

router
  .route("/resetPasswordRequest")
  .get(userController.showResetPasswordRequest)
  .post(userController.resetPasswordRequest);

router
  .route("/resetPassword")
  .get(userController.showResetPassword)
  .post(userController.resetPassword);

router
  .route("/:id")
  .get(auth, userController.getUserById)
  .delete(auth, userController.deleteUser);

module.exports = router;
