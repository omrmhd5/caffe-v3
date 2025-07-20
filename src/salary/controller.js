const PAGE_SIZE = require("../common/constants").PAGE_SIZE;
const salaryService = require("./service");
const branchService = require("../branch/service");
const notesService = require("../salaryNote/service");

exports.getAllSalaries = async (req, res) => {
  let branchID = null;
  let page = 1;

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

  if (req.query.p) {
    page = req.query.p;
  }

  let salaries = await salaryService.getAllSalariesWithPagination(
    branchID,
    page
  );

  let count = await salaryService.getCount(branchID);
  count < PAGE_SIZE ? (count = 1) : (count = count);

  res.render("salary/viewSalaries.hbs", {
    branches,
    salaries,
    branchID,
    branch,
    branchedRole: req.user.branchedRole,
    pagination: {
      page,
      pageCount: Math.ceil(count / PAGE_SIZE),
    },
  });
};

exports.showAdd = async (req, res) => {
  let branches = await branchService.getAllBranches(req.user.companyID);
  res.render("salary/addSalary.hbs", { branches });
};

exports.createSalary = async (req, res) => {
  try {
    let data = JSON.parse(req.body.data);
    let notes = JSON.parse(req.body.notes);

    notesService.addBulk(notes);
    await salaryService.updateBulk(req.user, data);

    res.send({ message: "أضيفت البيانات بنجاح" });
  } catch (error) {
    console.log(error, error.status, error.message);
    res.status(error.status).send({ errorMessage: error.message });
  }
};

exports.showEdit = async (req, res) => {
  const id = req.params.id;
  const salary = await salaryService.getSalaryById(id);
  let branches = await branchService.getAllBranches(req.user.companyID);

  res.render("salary/editSalary.hbs", { salary, branches });
};

exports.updateSalary = async (req, res) => {
  let salary = null;
  let branches = null;

  try {
    const id = req.params.id;
    const branchID = req.body.branchID;
    const employeeID = req.body.employeeID;
    const salary = req.body.salary;
    const advancePayment = req.body.advancePayment;
    const amountIncrease = req.body.amountIncrease;
    const amountDecrease = req.body.amountDecrease;
    const daysIncrease = req.body.daysIncrease;
    const daysDecrease = req.body.daysDecrease;
    const netSalary = req.body.netSalary;

    salary = await salaryService.getSalaryById(id);
    branches = await branchService.getAllBranches(req.user.companyID);

    salary = await salaryService.updateSalary(
      id,
      branchID,
      salary,
      advancePayment,
      amountIncrease,
      daysIncrease,
      amountDecrease,
      daysDecrease,
      netSalary
    );

    res.render("salary/editSalary.hbs", {
      salary,
      branches,
      successMessage: "تم تعديل بينات الراتب",
    });
  } catch (error) {
    res.render("salary/editSalary.hbs", {
      salary,
      branches,
      errorMessage: error.message,
    });
  }
};

exports.deleteSalary = async (req, res) => {
  try {
    const id = req.params.id;
    await salaryService.deleteSalary(id);

    res.send({ message: "حذف الراتب بنجاح" });
  } catch (error) {
    console.log(error, error.status, error.message);
    res.status(error.status).send({ errorMessage: error.message });
  }
};

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
  } else {
    const date = new Date();
    const y = date.getFullYear();
    let m = date.getMonth() + 1;
    if (m < 10) m = `0${m}`;

    month = `${y}/${m}`
  }

  const notes = await notesService.getNotes(branchID, month, req.user);
  let { results, total } = await salaryService.getAllSalaries(
    branchID,
    month,
    req.user.role
  );

  res.render("salary/salaryReport.hbs", {
    branches,
    notes,
    salaries: results,
    total,
    branch,
    branchID,
    branchedRole: req.user.branchedRole,
    month,
  });
};
