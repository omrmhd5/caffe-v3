const TaxValue = require("../../models/taxValue");

exports.addTaxValue = (taxValue) => {
  return TaxValue.updateOne(
    {
      branchID: taxValue.branchID,
      date: taxValue.date,
    },
    taxValue,
    {
      upsert: true,
    }
  );
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
