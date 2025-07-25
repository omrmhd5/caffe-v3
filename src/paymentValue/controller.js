const paymentValueService = require("./service");

exports.addPaymentValue = async (req, res) => {
  try {
    let paymentValue = JSON.parse(req.body.paymentValue);
    await paymentValueService.addPaymentValue(paymentValue);
    res.send({ message: "تم حفظ القيم بنجاح" });
  } catch (error) {
    console.log(error, error.status, error.message);
    res.status(error.status || 500).send({ errorMessage: error.message });
  }
};

exports.getPaymentValue = async (req, res) => {
  try {
    const { branchID, date } = req.query;
    const value = await paymentValueService.getPaymentValue(branchID, date);
    res.send(value);
  } catch (error) {
    console.log(error, error.status, error.message);
    res.status(error.status || 500).send({ errorMessage: error.message });
  }
};
