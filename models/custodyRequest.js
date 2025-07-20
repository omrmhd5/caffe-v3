const mongoose = require("mongoose");

const custodyRequestSchema = new mongoose.Schema(
  {
    branchID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
    },
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    custodyID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Custody",
    },
    spendCount: {
      type: Number,
      required: false,
    },
    returnCount: {
      type: Number,
      required: false,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: "waiting",
    },
  },
  {
    timestamps: true,
  }
);

const CustodyRequest = mongoose.model("CustodyRequest", custodyRequestSchema);

module.exports = CustodyRequest;
