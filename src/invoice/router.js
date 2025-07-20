const express = require("express");
const router = express.Router();
const invoiceController = require("./controller");
const { auth } = require("../middleware/auth");
const { uploadImage } = require("../middleware/uploadImage");

router.route("/").get(auth, invoiceController.getAllInvoices);

router
  .route("/add")
  .get(auth, invoiceController.showAdd)
  .post(auth, uploadImage, invoiceController.createInvoice);

router
  .route("/:id/edit")
  .get(auth, invoiceController.showEdit)
  .post(auth, uploadImage, invoiceController.updateInvoice);

router.route("/report").get(auth, invoiceController.report);
router.route("/excel-report").get(auth, invoiceController.excelReport);

router
  .route("/:id")
  .get(auth, invoiceController.showInvoice)
  .delete(auth, invoiceController.deleteInvoice);

module.exports = router;
