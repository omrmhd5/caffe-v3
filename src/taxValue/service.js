const TaxValue = require("../../models/taxValue");
const moment = require("moment");
const { toMonthStartDate } = require("../common/date");
const branchService = require("../branch/service");

exports.addTaxValue = async (taxValue) => {
  const normalizedDate = toMonthStartDate(taxValue.date);

  // Update branch mada ratio history for future months only if madaRatio is valid
  if (
    taxValue.madaRatio !== undefined &&
    !isNaN(parseFloat(taxValue.madaRatio))
  ) {
    await branchService.updateMadaRatioHistory(
      taxValue.branchID,
      parseFloat(taxValue.madaRatio),
      normalizedDate
    );
  }

  // Save/update the current month's tax value (including mada ratio)
  const taxValueToSave = {
    ...taxValue,
    date: normalizedDate,
  };

  await TaxValue.updateOne(
    {
      branchID: taxValue.branchID,
      date: normalizedDate,
    },
    taxValueToSave,
    {
      upsert: true,
    }
  );
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

  // Get mada ratio from branch history only if not available in TaxValue
  if (!result || result.madaRatio === undefined) {
    const branch = await branchService.getBranchById(branchID);
    if (branch && branch.madaRatioHistory) {
      const d = new Date(normalizedDate);
      let best = null;
      for (const entry of branch.madaRatioHistory) {
        if (entry.fromDate <= d && (!best || entry.fromDate > best.fromDate)) {
          best = entry;
        }
      }
      result = result || {};
      result.madaRatio = best ? best.value : 0;
    }
  }

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
