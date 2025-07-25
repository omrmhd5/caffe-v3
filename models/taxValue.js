const mongoose = require("mongoose");

const taxValueSchema = new mongoose.Schema(
  {
    branchID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    madaRatio: {
      type: Number,
      default: 0.0,
    },
    madaRatioSum: {
      type: Number,
      default: 0.0,
    },
    madaTax: {
      type: Number,
      default: 0.0,
    },
    madaRatioTotal: {
      type: Number,
      default: 0.0,
    },
    visaRatio: {
      type: Number,
      default: 0.0,
    },
    visaRatioSum: {
      type: Number,
      default: 0.0,
    },
    visaRatioTotal: {
      type: Number,
      default: 0.0,
    },
    visaTax: {
      type: Number,
      default: 0.0,
    },
    taxRatioTotal: {
      type: Number,
      default: 0.0,
    },
    paidValues: {
      type: [Number],
      default: [0, 0, 0],
    },
    receivedValues: {
      type: [Number],
      default: [0, 0, 0],
    },
    date: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const TaxValue = mongoose.model("TaxValue", taxValueSchema);

module.exports = TaxValue;
