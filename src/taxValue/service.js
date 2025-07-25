const TaxValue = require("../../models/taxValue");
const moment = require("moment");

exports.addTaxValue = async (taxValue) => {
  // Save/update for the current month
  await TaxValue.updateOne(
    {
      branchID: taxValue.branchID,
      date: taxValue.date,
    },
    taxValue,
    {
      upsert: true,
    }
  );

  // Overwrite this and all future months (even if they already have a value)
  let currentMonth = moment(taxValue.date, "YYYY-MM").startOf("month");
  // Propagate up to 24 months in the future (arbitrary limit)
  for (let i = 0; i < 24; i++) {
    const futureDate = moment(currentMonth).add(i, "month").toDate();
    await TaxValue.updateOne(
      {
        branchID: taxValue.branchID,
        date: futureDate,
      },
      {
        $set: {
          madaRatio: taxValue.madaRatio,
          madaRatioSum: taxValue.madaRatioSum,
          madaTax: taxValue.madaTax,
          madaRatioTotal: taxValue.madaRatioTotal,
        },
      },
      { upsert: true }
    );
  }
};

exports.getTaxValue = async (branchID, date, user) => {
  let result = await TaxValue.findOne({
    branchID,
    date,
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
