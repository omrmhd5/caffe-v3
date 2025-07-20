const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  employeeName: {
    type: String,
    required: true,
  },
  employeeID: {
    type: String,
  },
  branchID: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Branch",
  },
  companyID: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Company",
  },
  onHoliday: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    default: "working",
  },
});

employeeSchema.virtual("salaryDetails", {
  ref: "Salary",
  localField: "_id",
  foreignField: "employeeID",
});

const Employee = mongoose.model("Employee", employeeSchema);

module.exports = Employee;
