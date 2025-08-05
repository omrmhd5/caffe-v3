const mongoose = require("mongoose");
const Cashier = require("./cashier");
const User = require("./user");
const Item = require("./item");
const Store = require("./store");
const Sales = require("./sales");
const branchSchema = new mongoose.Schema({
  branchname: {
    type: String,
    required: true,
  },
  companyID: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Company",
  },
  hidden: {
    type: Boolean,
    default: false,
  },
  hiddenFromDate: {
    type: Date,
    default: null,
  },
  rentHistory: [
    {
      value: { type: Number, required: true },
      fromDate: { type: Date, required: true },
    },
  ],
  historyValues: {
    madaRatio: [
      {
        value: { type: Number, required: true },
        fromDate: { type: Date, required: true },
      },
    ],
    visaRatio: [
      {
        value: { type: Number, required: true },
        fromDate: { type: Date, required: true },
      },
    ],
    madaTax: [
      {
        value: { type: Number, required: true },
        fromDate: { type: Date, required: true },
      },
    ],
    visaTax: [
      {
        value: { type: Number, required: true },
        fromDate: { type: Date, required: true },
      },
    ],
  },
  // custodies: [
  //   {
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: "Custody",
  //   },
  // ],
  // custodyRequests: [
  //   {
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: "CustodyRequest",
  //   },
  // ],
});

branchSchema.virtual("store", {
  ref: "Store",
  localField: "_id",
  foreignField: "branchID",
});

branchSchema.virtual("item", {
  ref: "Item",
  localField: "_id",
  foreignField: "branchID",
});

branchSchema.virtual("sales", {
  ref: "Sales",
  localField: "_id",
  foreignField: "branchID",
});

const Branch = mongoose.model("Branch", branchSchema);

module.exports = Branch;
