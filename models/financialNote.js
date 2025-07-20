const mongoose = require("mongoose");

const financialNoteSchema = new mongoose.Schema({
  companyID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
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

const FinancialNote = mongoose.model("FinancialNote", financialNoteSchema);

module.exports = FinancialNote;
