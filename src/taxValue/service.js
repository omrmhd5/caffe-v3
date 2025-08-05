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

  // Update branch visa ratio history for future months only if visaRatio is valid
  if (
    taxValue.visaRatio !== undefined &&
    !isNaN(parseFloat(taxValue.visaRatio))
  ) {
    await branchService.updateVisaRatioHistory(
      taxValue.branchID,
      parseFloat(taxValue.visaRatio),
      normalizedDate
    );
  }

  // Update branch mada tax history for future months only if madaTax is valid
  if (taxValue.madaTax !== undefined && !isNaN(parseFloat(taxValue.madaTax))) {
    await branchService.updateMadaTaxHistory(
      taxValue.branchID,
      parseFloat(taxValue.madaTax),
      normalizedDate
    );
  }

  // Update branch visa tax history for future months only if visaTax is valid
  if (taxValue.visaTax !== undefined && !isNaN(parseFloat(taxValue.visaTax))) {
    await branchService.updateVisaTaxHistory(
      taxValue.branchID,
      parseFloat(taxValue.visaTax),
      normalizedDate
    );
  }

  // Save/update the current month's tax value (including all ratios and taxes)
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

  // Get historical values from branch history if not available in TaxValue
  if (!result) {
    result = {};
  }

  const branch = await branchService.getBranchById(branchID);
  if (branch) {
    const d = new Date(normalizedDate);

    // Get mada ratio from branch history only if not available in TaxValue
    if (result.madaRatio === undefined && branch.historyValues?.madaRatio) {
      let best = null;
      for (const entry of branch.historyValues.madaRatio) {
        if (entry.fromDate <= d && (!best || entry.fromDate > best.fromDate)) {
          best = entry;
        }
      }
      result.madaRatio = best ? best.value : 0;
    }

    // Get visa ratio from branch history only if not available in TaxValue
    if (result.visaRatio === undefined && branch.historyValues?.visaRatio) {
      let best = null;
      for (const entry of branch.historyValues.visaRatio) {
        if (entry.fromDate <= d && (!best || entry.fromDate > best.fromDate)) {
          best = entry;
        }
      }
      result.visaRatio = best ? best.value : 0;
    }

    // Get mada tax from branch history only if not available in TaxValue
    if (result.madaTax === undefined && branch.historyValues?.madaTax) {
      let best = null;
      for (const entry of branch.historyValues.madaTax) {
        if (entry.fromDate <= d && (!best || entry.fromDate > best.fromDate)) {
          best = entry;
        }
      }
      result.madaTax = best ? best.value : 0;
    }

    // Get visa tax from branch history only if not available in TaxValue
    if (result.visaTax === undefined && branch.historyValues?.visaTax) {
      let best = null;
      for (const entry of branch.historyValues.visaTax) {
        if (entry.fromDate <= d && (!best || entry.fromDate > best.fromDate)) {
          best = entry;
        }
      }
      result.visaTax = best ? best.value : 0;
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
