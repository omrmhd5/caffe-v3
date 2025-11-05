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

exports.approvePaymentValue = async (req, res) => {
  try {
    const { branchID, date } = req.body;
    await paymentValueService.approvePaymentValue(branchID, date);
    res.send({ message: "تم قبول القيم بنجاح" });
  } catch (error) {
    console.log(error, error.status, error.message);
    res.status(error.status || 500).send({ errorMessage: error.message });
  }
};

exports.rejectPaymentValue = async (req, res) => {
  try {
    const { branchID, date } = req.body;
    await paymentValueService.rejectPaymentValue(branchID, date);
    res.send({ message: "تم رفض القيم وإعادة تعيينها" });
  } catch (error) {
    console.log(error, error.status, error.message);
    res.status(error.status || 500).send({ errorMessage: error.message });
  }
};

exports.approvePaymentField = async (req, res) => {
  try {
    const { branchID, date, fieldIndex } = req.body;
    await paymentValueService.approvePaymentField(branchID, date, parseInt(fieldIndex));
    res.send({ message: `تم قبول مبلغ محول ${parseInt(fieldIndex) + 1} بنجاح` });
  } catch (error) {
    console.log(error, error.status, error.message);
    res.status(error.status || 500).send({ errorMessage: error.message });
  }
};

exports.rejectPaymentField = async (req, res) => {
  try {
    const { branchID, date, fieldIndex } = req.body;
    await paymentValueService.rejectPaymentField(branchID, date, parseInt(fieldIndex));
    res.send({ message: `تم رفض مبلغ محول ${parseInt(fieldIndex) + 1} وإعادة تعيينه` });
  } catch (error) {
    console.log(error, error.status, error.message);
    res.status(error.status || 500).send({ errorMessage: error.message });
  }
};
