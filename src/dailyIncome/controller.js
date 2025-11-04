const dailyIncomService = require("./service");
const branchService = require("../branch/service");
const financialService = require("../financial/service");
const taxValueService = require("../taxValue/service");
const paymentValueService = require("../paymentValue/service");
const notesService = require("../dailyIncomeNote/service");
const moment = require("moment");

exports.report = async (req, res) => {
  let branchID = null;
  let month = null;
  let branch = null;
  let branches = await branchService.getAllBranches(req.user.companyID);

  if (req.user.branchedRole) {
    branchID = req.user.branchID;
  } else {
    branchID = req.query.branchID;
    branches = branches.map((branch) => {
      if (branch._id == branchID) {
        branch.selected = "selected";
      }
      return branch;
    });
  }

  branch = await branchService.getBranchById(branchID);

  if (req.query.month) {
    month = req.query.month;
  }

  let { data, totals } = await dailyIncomService.getAll(
    branchID,
    month,
    req.user
  );

  let financials = null;
  if (branch) {
    const dateObj = new Date(month + "-01"); // Ensures YYYY-MM-01 format
    financials = await financialService.calculateTotalsByDate(dateObj, [
      branch,
    ]);

    if (!financials) {
      financials = {
        totalSalaries: 0.0,
        totalExpenses: 0.0,
        totalBills: 0.0,
      };
    }
  }

  const taxValue = await taxValueService.getTaxValue(
    branchID,
    req.query.month,
    req.user
  );

  const paymentValue = await paymentValueService.getPaymentValue(
    branchID,
    month
  );

  // Check if paid fields should be disabled
  // If approved, disable only for non-managers (managers can still edit)
  // If not approved and not manager, check timer (1 hour)
  let disablePaidFields = "";
  const isManager =
    req.user.role === "Manager" || req.user.role === "AccountantManager";

  // If approved, disable only for non-managers
  if (paymentValue && paymentValue.approved === true && !isManager) {
    disablePaidFields = "disabled";
  } else if (!isManager && paymentValue && paymentValue.createdAt) {
    // Check timer for non-managers if not approved (1 hour = 3600 seconds)
    const createdAt = new Date(paymentValue.createdAt);
    const currentTime = new Date();
    const hoursPassed = (currentTime - createdAt) / (1000 * 60 * 60); // Convert to hours

    if (hoursPassed > 1) {
      disablePaidFields = "disabled";
    }
  }

  // Check if there are any non-zero paid values (for showing approve/reject buttons)
  let hasNonZeroPaidValues = false;
  if (paymentValue && paymentValue.paidValues) {
    hasNonZeroPaidValues = paymentValue.paidValues.some((val) => val > 0);
  }

  // Get notes for the current month and branch
  const notes = await notesService.getNotes(branchID, month, req.user);

  const disableSaveRatio =
    new Date(month).getMonth() < new Date().getMonth() && req.user.branchedRole
      ? "disabled"
      : "";

  res.render("dailyIncome/dailyIncomeReport.hbs", {
    branches,
    taxValue,
    financials,
    data,
    totals: totals ? totals[0] : [],
    branch,
    branchID,
    branchedRole: req.user.branchedRole,
    month,
    disableSaveRatio,
    paymentValue,
    userRole: req.user.role,
    isManager:
      req.user.role === "Manager" || req.user.role === "AccountantManager",
    disablePaidFields,
    hasNonZeroPaidValues,
    notes,
  });
};

exports.addDailyIncome = async (req, res) => {
  try {
    let data = JSON.parse(req.body.data);
    await dailyIncomService.addDailyIncome(data.branchID, data.date, data);

    await financialService.updateIncomeAndNetIncome(
      data.branchID,
      data.date,
      req.user._id
    );

    res.send({ message: "أضيفت البيانات بنجاح" });
  } catch (error) {
    res.status(error.status).send({ errorMessage: error.message });
  }
};

exports.saveNotes = async (req, res) => {
  try {
    let notes = JSON.parse(req.body.notes);
    await notesService.addBulk(notes);
    res.send({ message: "أضيفت الملاحظات بنجاح" });
  } catch (error) {
    res.status(error.status).send({ errorMessage: error.message });
  }
};
