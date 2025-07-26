const TaxValue = require("../../models/taxValue");
const moment = require("moment");
const { toMonthStartDate } = require("../common/date");

exports.addTaxValue = async (taxValue) => {
  const normalizedDate = toMonthStartDate(taxValue.date);
  // Save/update for the current month
  await TaxValue.updateOne(
    {
      branchID: taxValue.branchID,
      date: normalizedDate,
    },
    { ...taxValue, date: normalizedDate },
    {
      upsert: true,
    }
  );

  // Overwrite madaRatio and related fields for all future months (even if they already have a value)
  let currentMonth = toMonthStartDate(normalizedDate);
  for (let i = 0; i < 24; i++) {
    const futureDate = toMonthStartDate(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + i, 1)
    );
    await TaxValue.updateOne(
      {
        branchID: taxValue.branchID,
        date: futureDate,
      },
      {
        $set: {
          madaRatio: taxValue.madaRatio,
        },
      },
      { upsert: true }
    );
  }
};

exports.getTaxValue = async (branchID, date, user) => {
  const normalizedDate = toMonthStartDate(date);
  if (!date || isNaN(new Date(date).getTime())) {
    return null;
  }
  let result = await TaxValue.findOne({
    branchID,
    date: normalizedDate,
  }).lean();

  if (result) {
    const taxDate = new Date(result.createdAt);
    const currentDate = new Date();
    const hours = Math.abs(currentDate - taxDate) / 36e5;

    if (user && user.role != "AccountantManager" && hours > 2) {
      result.disabled = "disabled";
    }
  }

  return result;
};
