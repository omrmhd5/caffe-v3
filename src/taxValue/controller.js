const taxValueService = require("./service");
const financialService = require("../financial/service");

exports.addTaxValue = async (req, res) => {
  try {
    let taxValue = JSON.parse(req.body.taxValue);

    taxValue.taxRatioTotal = parseFloat(
      +taxValue.visaRatioTotal + +taxValue.madaRatioTotal
    ).toFixed(2);

    await taxValueService.addTaxValue(taxValue);

    // Update financial records with the new tax values
    await financialService.updateTaxValuesAndNetIncome(
      taxValue.branchID,
      taxValue.date,
      req.user._id
    );

    res.send({ message: "أضيفت البيانات بنجاح" });
  } catch (error) {
    console.log(error, error.status, error.message);
    res.status(error.status).send({ errorMessage: error.message });
  }
};
