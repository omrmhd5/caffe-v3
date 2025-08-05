const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    branchID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
    },
    serialNumber: {
      type: Number,
      required: true,
    },
    invoiceNumber: {
      type: String,
      required: false,
    },
    registrationNumber: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
    },
    warrantyYears: {
      type: Number,
      default: 0,
    },
    warranty: {
      type: Boolean,
      default: false,
    },
    amount: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    taxRatio: {
      type: Number,
      required: true,
    },
    taxValue: {
      type: Number,
      required: true,
    },
    supplierTaxNumber: {
      type: String,
      required: false,
    },
    supplierName: {
      type: String,
      required: false,
    },
    date: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

invoiceSchema.index({ description: "text" });
// Add unique compound index to prevent duplicate serial numbers within the same branch
invoiceSchema.index({ branchID: 1, serialNumber: 1 }, { unique: true });

const Invoice = mongoose.model("Invoice", invoiceSchema);

module.exports = Invoice;
