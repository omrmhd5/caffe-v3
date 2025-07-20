const mongoose = require("mongoose");

const salarySchema = new mongoose.Schema(
  {
    branchID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Branch",
    },
    employeeID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Employee",
    },
    salary: {
      type: Number,
      required: true,
    },
    amountIncrease: {
      type: Number,
      required: true,
    },
    daysIncrease: {
      type: Number,
      required: true,
    },
    amountDecrease: {
      type: Number,
      required: true,
    },
    daysDecrease: {
      type: Number,
      required: true,
    },
    advancePayment: {
      type: Number,
      required: true,
      default: 0,
    },
    netSalary: {
      type: Number,
      required: true,
    },
    accounter: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

const Salary = mongoose.model("Salary", salarySchema);

module.exports = Salary;
