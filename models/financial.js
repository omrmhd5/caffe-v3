const mongoose = require("mongoose");

const financialSchema = new mongoose.Schema(
  {
    branchID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Branch",
    },
    income: {
      type: Number,
      required: true,
    },
    rent: {
      type: Number,
      required: true,
    },
    expenses: {
      type: Number,
      required: true,
    },
    bankRatio: {
      type: Number,
      required: true,
    },
    salaries: {
      type: Number,
      required: true,
    },
    saudizationSalary: {
      type: Number,
      required: true,
      default: 0,
    },
    bills: {
      type: Number,
      required: true,
    },
    bills1: {
      type: Number,
      required: true,
    },
    bills2: {
      type: Number,
      required: true,
    },
    netIncome: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    comment: {
      type: String,
    },
    partners: {
      type: Number,
    },
    accounter: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for better query performance
financialSchema.index({ branchID: 1, date: 1 });
financialSchema.index({ date: 1 });
financialSchema.index({ branchID: 1 });

const Financial = mongoose.model("Financial", financialSchema);

module.exports = Financial;
