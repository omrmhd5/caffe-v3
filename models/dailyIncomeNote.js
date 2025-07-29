const mongoose = require("mongoose");

const dailyIncomeNoteSchema = new mongoose.Schema({
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

const DailyIncomeNote = mongoose.model(
  "DailyIncomeNote",
  dailyIncomeNoteSchema
);

module.exports = DailyIncomeNote;
