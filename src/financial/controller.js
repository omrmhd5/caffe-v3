require("../common/date");
const financialService = require("./service");
const branchService = require("../branch/service");
const partnerService = require("../partner/service");
const noteService = require("../financialNote/service");

exports.report = async (req, res) => {
  let date = null;
  if (req.query.date) {
    date = req.query.date;
  } else {
    date = new Date().toDateInputValue();
  }

  let { financials, totals } = await financialService.report(date, req.user);

  res.render("financial/financialReport.hbs", {
    financials,
    totals,
    date,
    company: req.user.companyID,
  });
};

exports.getAllFinancials = async (req, res) => {
  let date = null;
  let branchID = null;
  let branches = await branchService.getAllBranches(req.user.companyID);

  if (req.query.date) {
    date = req.query.date;
  } else {
    date = new Date().toDateInputValue();
  }

  if (req.query.branchID) {
    branchID = req.query.branchID;
    branches = branches.map((branch) => {
      if (branch._id == branchID) {
        branch.selected = "selected";
      }
      return branch;
    });
  }

  let financials = await financialService.getAllFinancials(
    date,
    branchID,
    req.user
  );

  res.render("financial/viewFinancials.hbs", {
    financials,
    branches,
    branchID,
    date,
  });
};

exports.updateFinancials = async (req, res) => {
  let date = req.body.date;
  let branchID = req.body.branchID;
  let branches = await branchService.getAllBranches(req.user.companyID);

  branches = branches.map((branch) => {
    if (branch._id == branchID) {
      branch.selected = "selected";
    }
    return branch;
  });

  let financials = await financialService.updateFinance(date, branchID, {
    income: req.body.income,
    rent: req.body.rent,
    expenses: req.body.expenses,
    bankRatio: req.body.bankRatio,
    salaries: req.body.salaries,
    saudizationSalary: req.body.saudizationSalary,
    bills: req.body.bills,
    bills1: req.body.bills1,
    bills2: req.body.bills2,
  });

  res.send({ message: "أضيف الراتب بنجاح" });
};

exports.createFinancials = async (req, res) => {
  let data = JSON.parse(req.body.data);
  let notes = JSON.parse(req.body.notes);
  let rentNotes = JSON.parse(req.body.rentNotes);
  let date = req.body.date;

  let partnersCount = req.body.partnersCount;
  await partnerService.update(date, partnersCount);
  await noteService.addBulk(date, notes, req.user.companyID._id);

  for (let rentNote of rentNotes) {
    await financialService.updateRentNote(rentNote.branchID, rentNote.note);
  }

  for (let financial of data) {
    await financialService.updateFinance(date, financial.branchID, {
      income: financial.income,
      rent:  parseFloat(financial.rent),
      expenses: financial.expenses,
      bankRatio: financial.bankRatio,
      salaries: financial.salaries,
      saudizationSalary: financial.saudizationSalary,
      bills: financial.bills,
      bills1: financial.bills1,
      bills2: financial.bills2,
    });
  }

  res.send({ message: "أضيفت  بنجاح" });
};

exports.showAdd = async (req, res) => {
  let date = req.query.date;
  if (!date) {
    date = new Date().toDateInputValue();
  }

  const { data, incomes, totals, partner } = await financialService.showAdd(
    date,
    req.user
  );

  const notes = await noteService.getDoubledByDate(date, req.user.companyID);

  res.render("financial/addFinancial.hbs", {
    notes,
    data,
    date,
    totals,
    incomes: incomes[0],
    partnersCount: partner ? partner.partnersCount : 0,
    company: req.user.companyID,
  });
};

exports.updateComments = async (req, res) => {
  let date = req.body.date;
  let branchID = req.body.branchID;
  let financialComment = req.body.financialComment;
  let rentComment = req.body.rentComment;

  let branches = await branchService.getAllBranches(req.user.companyID);

  branches = branches.map((branch) => {
    if (branch._id == branchID) {
      branch.selected = "selected";
    }
    return branch;
  });

  await financialService.updateComment(
    new Date(date).toDateInputValue(),
    branchID,
    financialComment,
    rentComment
  );

  res.send({ message: "أضيفت الملاحظات بنجاح" });
};
