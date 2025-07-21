const multer = require("multer");
const express = require("express");
const router = express.Router();
const companyController = require("./controller");
const { auth, isSuperAdmin } = require("../middleware/auth");

const upload = multer({
  limits: {
    fileSize: 200000000,
  },
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/uploads");
    },
    filename: (req, file, callback) => {
      const extenstion = file.originalname.split(".");
      callback(
        null,
        (extenstion[0] + new Date().getTime() + "." + extenstion[1]).trim()
      );
    },
  }),
});

router.route("/").get(auth, isSuperAdmin, companyController.getAllCompanies);

router
  .route("/add")
  .get(auth, isSuperAdmin, companyController.addCompany)
  .post(
    auth,
    isSuperAdmin,
    upload.single("image"),
    companyController.createCompany
  );

router
  .route("/:id/edit")
  .get(auth, isSuperAdmin, companyController.showEdit)
  .post(
    auth,
    isSuperAdmin,
    upload.single("image"),
    companyController.updateCompany
  );

router.route("/:id").get(auth, isSuperAdmin, companyController.viewCompany);

router
  .route("/:id")
  .delete(auth, isSuperAdmin, companyController.deleteCompany);

router.post("/:id/hide", auth, isSuperAdmin, companyController.hideCompany);
router.post("/:id/unhide", auth, isSuperAdmin, companyController.unhideCompany);
router.post(
  "/:id/rent",
  auth,
  isSuperAdmin,
  companyController.updateRentHistory
);

module.exports = router;
