const mongoose = require("mongoose");

const dailyIncomeSchema = new mongoose.Schema(
  {
    branchID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true
    },
    cash: {
      type: Number,
      required: true,
    },
    coffeeShop: {
      type: Number,
      required: true,
    },
    addedIncome: {
      type: Number,
      required: true,
    },
    mada: {
      type: Number,
      required: true,
    },
    visa: {
      type: Number,
      required: true,
    },
    bankTransfer: {
      type: Number,
      required: true,
    },
    arbitrage: {
      type: Number,
      required: true,
    },
    dailyTotal: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

const DailyIncome = mongoose.model("DailyIncome", dailyIncomeSchema);

module.exports = DailyIncome;
