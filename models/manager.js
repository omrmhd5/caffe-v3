const mongoose = require("mongoose");
const User = require("./user");
const managerSchema = new mongoose.Schema({
  companyID: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Company",
  },
  managerID: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
});

const Manager = mongoose.model("Manager", managerSchema);

module.exports = Manager;
