const mongoose = require("mongoose");

const paymentValueSchema = new mongoose.Schema(
  {
    branchID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    paidValues: {
      type: [Number],
      default: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    receivedValues: {
      type: [Number],
      default: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for better query performance
paymentValueSchema.index({ branchID: 1, date: 1 });
paymentValueSchema.index({ date: 1 });

const PaymentValue = mongoose.model("PaymentValue", paymentValueSchema);

module.exports = PaymentValue;
