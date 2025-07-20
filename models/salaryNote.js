const mongoose = require("mongoose");

const salaryNoteSchema = new mongoose.Schema({
  branchID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
  },
  date: {
    type: Date,
    required: true,
  },
  note: {
    type: String,
    required: true,
  },
});

const SalaryNote = mongoose.model("SalaryNote", salaryNoteSchema);

module.exports = SalaryNote;
