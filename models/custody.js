const mongoose = require("mongoose");

const custodySchema = new mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    branchID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
    },
    companyID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },
    name: {
      type: String,
      required: true,
    },
    receivedDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: "available",
    },
    expireDate: {
      type: Date,
      required: false,
    },
    expire: {
      type: Boolean,
      default: false,
    },
    warrantyYears: {
      type: Number,
      default: 0,
    },
    warranty: {
      type: Boolean,
      default: false,
    },
    invalidItemsNumber: {
      type: Number,
      default: 0,
    },
    addedCustodies: [
      { type: mongoose.Schema.Types.ObjectId, ref: "AddedCustody" },
    ],
  },
  {
    timestamps: true,
  }
);

const Custody = mongoose.model("Custody", custodySchema);

module.exports = Custody;
