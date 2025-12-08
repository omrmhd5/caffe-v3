const mongoose = require("mongoose");

const transferSchema = new mongoose.Schema(
  {
    branchID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    companyName: {
      type: String,
      required: true,
    },
    reservationRef: {
      type: String,
      required: true,
    },
    reservationDate: {
      type: String,
      required: true,
    },
    reservationAmount: {
      type: Number,
      default: 0,
    },
    sentAmount: {
      type: Number,
      default: 0,
    },
    transferredAmount: {
      type: Number,
      default: 0,
    },
    transferredAmountUpdatedAt: {
      type: Date,
      default: null,
    },
    commissionVoucher: {
      type: Number,
      default: 0,
    },
    bankFees: {
      type: Number,
      default: 0,
    },
    voucherNumber: {
      type: String,
      default: "",
    },
    voucherNumberUpdatedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: "",
    },
    notesUpdatedAt: {
      type: Date,
      default: null,
    },
    approved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

// Add indexes for better query performance
transferSchema.index({ branchID: 1 });
transferSchema.index({ createdAt: 1 });

const Transfer = mongoose.model("Transfer", transferSchema);

module.exports = Transfer;
