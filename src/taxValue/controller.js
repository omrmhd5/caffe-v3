const taxValueService = require("./service");

exports.addTaxValue = async (req, res) => {
  try {
    let taxValue = JSON.parse(req.body.taxValue);

    taxValue.taxRatioTotal = parseFloat(
      +taxValue.visaRatioTotal + +taxValue.madaRatioTotal
    ).toFixed(2);

    await taxValueService.addTaxValue(taxValue);

    res.send({ message: "أضيفت البيانات بنجاح" });
  } catch (error) {
    console.log(error, error.status, error.message);
    res.status(error.status).send({ errorMessage: error.message });
  }
};
