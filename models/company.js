const mongoose = require("mongoose");
const Branch = require("./branch");
const Manager = require("./manager");
const Cashier = require("./cashier");
const User = require("./user");
const Item = require("./item");
const Store = require("./store");
const Sales = require("./sales");

const companySchema = new mongoose.Schema(
  {
    companyname: {
      type: String,
      required: true,
      unique: true,
    },
    companyImage: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    email: {
      type: String,
    },
    location: {
      type: String,
    },
    notes: {
      type: String,
    },
    hidden: {
      type: Boolean,
      default: false,
    },
    hiddenFromDate: {
      type: Date,
      default: null,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

companySchema.virtual("branches", {
  ref: "Branch",
  localField: "_id",
  foreignField: "companyID",
});

const Company = mongoose.model("Company", companySchema);

module.exports = Company;
