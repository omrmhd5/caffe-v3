const PaymentValue = require("../../models/paymentValue");
const { toMonthStartDate } = require("../common/date");

exports.addPaymentValue = async (paymentValue) => {
  const normalizedDate = toMonthStartDate(paymentValue.date);
  await PaymentValue.updateOne(
    {
      branchID: paymentValue.branchID,
      date: normalizedDate,
    },
    { ...paymentValue, date: normalizedDate },
    { upsert: true }
  );
};

exports.getPaymentValue = async (branchID, date) => {
  const normalizedDate = toMonthStartDate(date);
  return PaymentValue.findOne({ branchID, date: normalizedDate }).lean();
};
