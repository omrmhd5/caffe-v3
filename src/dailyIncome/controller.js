const dailyIncomService = require("./service");
const branchService = require("../branch/service");
const financialService = require("../financial/service");
const taxValueService = require("../taxValue/service");
const moment = require('moment');

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
    financials = await financialService.calculateTotalsByDate(month, [branch]);
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

  const disableSaveRatio = new Date(month).getMonth() < new Date().getMonth() && req.user.branchedRole ? "disabled" : "";

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
    disableSaveRatio
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
    console.log(error, error.status, error.message);
    res.status(error.status).send({ errorMessage: error.message });
  }
};
