const mongoose = require("mongoose");
const rentSchema = new mongoose.Schema({
  rentDate: {
    type: String,
  },
  branchID: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Branch",
  },
});

// Add indexes for better query performance
rentSchema.index({ branchID: 1 });

const Rent = mongoose.model("Rent", rentSchema);

module.exports = Rent;
