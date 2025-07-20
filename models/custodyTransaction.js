const mongoose = require("mongoose");

const custodyTransactionSchema = new mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    custodyID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Custody",
    },
    custodyRequestID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustodyRequest",
    },
    spentCount: {
      type: Number,
      required: true,
      default: 0
    },
    addedCount: {
      type: Number,
      required: true,
      default: 0
    },
  },
  {
    timestamps: true,
  }
);

const CustodyTransaction = mongoose.model("CustodyTransaction", custodyTransactionSchema);

module.exports = CustodyTransaction;
