const PaymentValue = require("../../models/paymentValue");

exports.addPaymentValue = async (paymentValue) => {
  await PaymentValue.updateOne(
    {
      branchID: paymentValue.branchID,
      date: paymentValue.date,
    },
    paymentValue,
    { upsert: true }
  );
};

exports.getPaymentValue = async (branchID, date) => {
  return PaymentValue.findOne({ branchID, date }).lean();
};
