const PaymentValue = require("../../models/paymentValue");
const { toMonthStartDate } = require("../common/date");

exports.addPaymentValue = async (paymentValue) => {
  const normalizedDate = toMonthStartDate(paymentValue.date);

  // Ensure arrays have exactly 15 elements for paid, 5 for received
  const paidValues = Array.isArray(paymentValue.paidValues)
    ? [...paymentValue.paidValues]
    : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  const receivedValues = Array.isArray(paymentValue.receivedValues)
    ? [...paymentValue.receivedValues]
    : [0, 0, 0, 0, 0];

  // Pad arrays to exactly 15 elements for paid, 5 for received
  while (paidValues.length < 15) {
    paidValues.push(0);
  }
  while (receivedValues.length < 5) {
    receivedValues.push(0);
  }

  // Trim arrays if they have more than required elements
  if (paidValues.length > 15) {
    paidValues.splice(15);
  }
  if (receivedValues.length > 5) {
    receivedValues.splice(5);
  }

  // Get existing payment value to check for changes
  const existingPaymentValue = await PaymentValue.findOne({
    branchID: paymentValue.branchID,
    date: normalizedDate,
  });

  // Initialize arrays for tracking
  let lastSubmittedPaidValues =
    existingPaymentValue?.lastSubmittedPaidValues || [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ];
  let paidFieldStatuses = existingPaymentValue?.paidFieldStatuses || [
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ];

  // Ensure arrays have exactly 15 elements
  while (lastSubmittedPaidValues.length < 15) {
    lastSubmittedPaidValues.push(0);
  }
  while (paidFieldStatuses.length < 15) {
    paidFieldStatuses.push(null);
  }
  lastSubmittedPaidValues = lastSubmittedPaidValues.slice(0, 15);
  paidFieldStatuses = paidFieldStatuses.slice(0, 15);

  // Check which fields have changed compared to last submitted values
  // If a field changed and is not already approved, set status to 'pending'
  // If the value is zero, set status to null
  for (let i = 0; i < 15; i++) {
    // If the value is zero, set the status to null
    if (paidValues[i] === 0) {
      paidFieldStatuses[i] = null;
    } else if (paidValues[i] !== lastSubmittedPaidValues[i]) {
      // Field value changed compared to last submitted
      if (paidFieldStatuses[i] !== "approved") {
        // Set to pending if not already approved (allows changes to pending/rejected fields)
        // This includes rejected fields that are being resubmitted - they become pending
        paidFieldStatuses[i] = "pending";
      }
      // If approved, keep it as approved (don't change status)
    }
  }

  // Update last submitted values to current values (these are the values being saved)
  lastSubmittedPaidValues = [...paidValues];

  const paymentValueToSave = {
    ...paymentValue,
    date: normalizedDate,
    paidValues: paidValues,
    receivedValues: receivedValues,
    lastSubmittedPaidValues: lastSubmittedPaidValues,
    paidFieldStatuses: paidFieldStatuses,
    // Respect the approved value passed in (AccountantManager sets it to true)
    approved:
      paymentValue.approved !== undefined ? paymentValue.approved : false,
  };

  // Update createdAt when saving (for tracking purposes)
  if (paymentValue.approved === false || paymentValue.approved === undefined) {
    paymentValueToSave.createdAt = new Date();
  }

  await PaymentValue.updateOne(
    {
      branchID: paymentValue.branchID,
      date: normalizedDate,
    },
    paymentValueToSave,
    { upsert: true, setDefaultsOnInsert: true },
  );
};

exports.getPaymentValue = async (branchID, date) => {
  const normalizedDate = toMonthStartDate(date);
  const result = await PaymentValue.findOne({
    branchID,
    date: normalizedDate,
  }).lean();

  // Ensure the result has proper arrays with 15 elements for paid, 5 for received
  if (result) {
    if (!Array.isArray(result.paidValues) || result.paidValues.length < 15) {
      result.paidValues = [
        ...(result.paidValues || []),
        ...Array(15 - (result.paidValues?.length || 0)).fill(0),
      ];
    }
    if (
      !Array.isArray(result.receivedValues) ||
      result.receivedValues.length < 5
    ) {
      result.receivedValues = [
        ...(result.receivedValues || []),
        ...Array(5 - (result.receivedValues?.length || 0)).fill(0),
      ];
    }
    // Ensure lastSubmittedPaidValues has 15 elements
    if (
      !Array.isArray(result.lastSubmittedPaidValues) ||
      result.lastSubmittedPaidValues.length < 15
    ) {
      result.lastSubmittedPaidValues = [
        ...(result.lastSubmittedPaidValues || []),
        ...Array(15 - (result.lastSubmittedPaidValues?.length || 0)).fill(0),
      ];
    }
    // Ensure paidFieldStatuses has 15 elements
    if (
      !Array.isArray(result.paidFieldStatuses) ||
      result.paidFieldStatuses.length < 15
    ) {
      result.paidFieldStatuses = [
        ...(result.paidFieldStatuses || []),
        ...Array(15 - (result.paidFieldStatuses?.length || 0)).fill(null),
      ];
    }
  }

  return result;
};

// Approve a specific field (fieldIndex: 0-14)
exports.approvePaymentField = async (branchID, date, fieldIndex) => {
  const normalizedDate = toMonthStartDate(date);
  const paymentValue = await PaymentValue.findOne({
    branchID,
    date: normalizedDate,
  });

  if (!paymentValue) {
    throw new Error("Payment value not found");
  }

  const paidFieldStatuses = [
    ...(paymentValue.paidFieldStatuses || [
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ]),
  ];
  while (paidFieldStatuses.length < 15) {
    paidFieldStatuses.push(null);
  }
  paidFieldStatuses[fieldIndex] = "approved";

  await PaymentValue.updateOne(
    {
      branchID,
      date: normalizedDate,
    },
    { paidFieldStatuses: paidFieldStatuses },
    { upsert: false },
  );
};

// Reject a specific field (fieldIndex: 0-14)
exports.rejectPaymentField = async (branchID, date, fieldIndex) => {
  const normalizedDate = toMonthStartDate(date);
  const paymentValue = await PaymentValue.findOne({
    branchID,
    date: normalizedDate,
  });

  if (!paymentValue) {
    throw new Error("Payment value not found");
  }

  const paidFieldStatuses = [
    ...(paymentValue.paidFieldStatuses || [
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ]),
  ];
  const paidValues = [
    ...(paymentValue.paidValues || [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]),
  ];
  const lastSubmittedPaidValues = [
    ...(paymentValue.lastSubmittedPaidValues || [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]),
  ];

  while (paidFieldStatuses.length < 15) {
    paidFieldStatuses.push(null);
  }
  while (paidValues.length < 15) {
    paidValues.push(0);
  }
  while (lastSubmittedPaidValues.length < 15) {
    lastSubmittedPaidValues.push(0);
  }

  // Reset the field value to 0 and set status to rejected
  paidValues[fieldIndex] = 0;
  paidFieldStatuses[fieldIndex] = "rejected";
  // Keep lastSubmittedPaidValues unchanged so we can compare when resubmitted

  await PaymentValue.updateOne(
    {
      branchID,
      date: normalizedDate,
    },
    {
      paidValues: paidValues,
      paidFieldStatuses: paidFieldStatuses,
    },
    { upsert: false },
  );
};

// Legacy methods for backward compatibility (approve/reject all)
exports.approvePaymentValue = async (branchID, date) => {
  const normalizedDate = toMonthStartDate(date);
  await PaymentValue.updateOne(
    {
      branchID,
      date: normalizedDate,
    },
    { approved: true },
    { upsert: false },
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
      paidValues: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      receivedValues: [0, 0, 0, 0, 0],
      approved: false,
      createdAt: new Date(), // Reset createdAt when rejecting
    },
    { upsert: false },
  );
};
