const mongoose = require("mongoose");

const addedCustodySchema = new mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    receivedDate: {
      type: Date,
      required: true,
    },
    count: {
      type: Number,
      required: true,
      default: 0,
    },
    expireDate: {
      type: Date,
      required: false,
    },
    warrantyYears: {
      type: Number,
      default: 0,
    },
    custody: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Custody",
    },
  },
  {
    timestamps: true,
  }
);

const AddedCustody = mongoose.model("AddedCustody", addedCustodySchema);

module.exports = AddedCustody;
