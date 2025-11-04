const PaymentValue = require("../../models/paymentValue");
const { toMonthStartDate } = require("../common/date");

exports.addPaymentValue = async (paymentValue) => {
  const normalizedDate = toMonthStartDate(paymentValue.date);

  // Ensure arrays have exactly 10 elements
  const paidValues = Array.isArray(paymentValue.paidValues)
    ? [...paymentValue.paidValues]
    : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  const receivedValues = Array.isArray(paymentValue.receivedValues)
    ? [...paymentValue.receivedValues]
    : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  // Pad arrays to exactly 10 elements
  while (paidValues.length < 10) {
    paidValues.push(0);
  }
  while (receivedValues.length < 10) {
    receivedValues.push(0);
  }

  // Trim arrays if they have more than 10 elements
  if (paidValues.length > 10) {
    paidValues.splice(10);
  }
  if (receivedValues.length > 10) {
    receivedValues.splice(10);
  }

  const paymentValueToSave = {
    ...paymentValue,
    date: normalizedDate,
    paidValues: paidValues,
    receivedValues: receivedValues,
    // Respect the approved value passed in (AccountantManager sets it to true)
    approved: paymentValue.approved !== undefined ? paymentValue.approved : false,
  };

  // If non-manager is saving (approved is false or undefined), reset createdAt to restart timer
  // If approved is true (AccountantManager), don't reset createdAt
  if (paymentValue.approved === false || paymentValue.approved === undefined) {
    paymentValueToSave.createdAt = new Date();
  }

  await PaymentValue.updateOne(
    {
      branchID: paymentValue.branchID,
      date: normalizedDate,
    },
    paymentValueToSave,
    { upsert: true, setDefaultsOnInsert: true }
  );
};

exports.getPaymentValue = async (branchID, date) => {
  const normalizedDate = toMonthStartDate(date);
  const result = await PaymentValue.findOne({
    branchID,
    date: normalizedDate,
  }).lean();

  // Ensure the result has proper arrays with 10 elements
  if (result) {
    if (!Array.isArray(result.paidValues) || result.paidValues.length < 10) {
      result.paidValues = [
        ...(result.paidValues || []),
        ...Array(10 - (result.paidValues?.length || 0)).fill(0),
      ];
    }
    if (
      !Array.isArray(result.receivedValues) ||
      result.receivedValues.length < 10
    ) {
      result.receivedValues = [
        ...(result.receivedValues || []),
        ...Array(10 - (result.receivedValues?.length || 0)).fill(0),
      ];
    }
  }

  return result;
};

exports.approvePaymentValue = async (branchID, date) => {
  const normalizedDate = toMonthStartDate(date);
  await PaymentValue.updateOne(
    {
      branchID,
      date: normalizedDate,
    },
    { approved: true },
    { upsert: false }
  );
};

exports.rejectPaymentValue = async (branchID, date) => {
  const normalizedDate = toMonthStartDate(date);
  await PaymentValue.updateOne(
    {
      branchID,
      date: normalizedDate,
    },
    {
      paidValues: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      receivedValues: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      approved: false,
      createdAt: new Date(), // Reset timer so non-managers can edit until timer expires
    },
    { upsert: false }
  );
};
