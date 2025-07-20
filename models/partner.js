const mongoose = require("mongoose");

const partnerSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  partnersCount: {
    type: Number,
    required: true,
  },
});

const Partner = mongoose.model("Partner", partnerSchema);

module.exports = Partner;
