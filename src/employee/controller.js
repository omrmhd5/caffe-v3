const {
  NotFoundException,
  BadRequestException,
} = require("../common/errors/exceptions");

const PAGE_SIZE = require("../common/constants").PAGE_SIZE;
const statuses = require("../common/constants").EMPLOYEES_STATUS;
const employeeService = require("./service");
const branchService = require("../branch/service");
const companyService = require("../company/service");
const responseWrapper = require("../common/response/success");

exports.getAllEmployees = async (req, res) => {
  let page = 1;
  let status = null;
  let companyID = null;
  let branchID = null;
  let branches = await branchService.getAllBranches(req.user.companyID);

  if (req.query.p) {
    page = req.query.p;
  }

  if (req.query.status) {
    status = req.query.status;
  }

  if (req.query.companyID) {
    companyID = req.query.companyID;
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

  let companies = await companyService.getAllCompanies();

  let employees = await employeeService.getAllEmployeesWithPagination(
    req.user,
    companyID,
    branchID,
    status,
    page
  );

  let count = await employeeService.getCount(
    req.user,
    companyID,
    branchID,
    status,
    page
  );
  count < PAGE_SIZE ? (count = 1) : (count = count);

  res.render("employee/viewEmployees.hbs", {
    employees,
    companies,
    branches,
    branchID,
    companyID,
    pagination: {
      page,
      pageCount: Math.ceil(count / PAGE_SIZE),
    },
  });
};

exports.getUserById = async (req, res) => {
  let userId = req.params.id;
  let user = await employeeService.getUserById(userId);

  if (!user) {
    throw new NotFoundException("User not found");
  }

  return responseWrapper.success(res, user);
};

exports.deleteEmployee = async (req, res) => {
  try {
    let id = req.params.id;
    let message = await employeeService.deleteEmployee(id);

    res.send({ message });
  } catch (error) {
    console.log(error, error.status, error.message);
    res.status(error.status).send({ errorMessage: error.message });
  }
};

exports.showEdit = async (req, res) => {
  const id = req.params.id;
  const employee = await employeeService.getEmployeeById(id);
  let branches = null;

  if (employee.branchID) {
    branches = await branchService.getAllBranches(employee.branchID.companyID);
  } else {
    branches = await branchService.getAllBranches(req.user.companyID);
  }

  res.render("employee/editEmployee.hbs", { employee, statuses, branches });
};

exports.updateEmployee = async (req, res) => {
  let employee = null;
  let branches = null;

  try {
    const id = req.params.id;
    const employeeName = req.body.employeeName;
    const status = req.body.status;
    const branchID = req.body.branchID;

    employee = await employeeService.getEmployeeById(id);
    if (employee.branchID) {
      branches = await branchService.getAllBranches(
        employee.branchID.companyID
      );
    } else {
      branches = await branchService.getAllBranches(req.user.companyID);
    }

    employee = await employeeService.updateEmployee(
      id,
      employeeName,
      status,
      branchID
    );

    res.render("employee/editEmployee.hbs", {
      employee,
      branches,
      statuses,
      successMessage: "تم تعديل بينات الموظف",
    });
  } catch (error) {
    res.render("employee/editEmployee.hbs", {
      employee,
      branches,
      statuses,
      errorMessage: error.message,
    });
  }
};

exports.addEmployee = async (req, res) => {
  try {
    let branches = await branchService.getAllBranches(req.user.companyID);

    res.render("employee/addEmployee.hbs", {
      branches,
    });
  } catch (error) {}
};

exports.createEmployee = async (req, res) => {
  let companies = null;
  try {
    let employeeName = req.body.employeeName;
    let branchID = req.body.branchID;

    let companyID = req.body.companyID;
    if (!companyID) {
      let branch = await branchService.getBranchById(branchID);
      companyID = branch.companyID;
    }

    let branches = await branchService.getAllBranches(req.user.companyID);

    let duplicate = await employeeService.getEmployeeByName(employeeName);
    if (duplicate) {
      throw new BadRequestException("اسم الموظف موجود");
    }

    await employeeService.createEmployee(employeeName, branchID, companyID);

    res.render("employee/addEmployee.hbs", {
      successMessage: "أضيف الموظف بنجاح",
      branches,
    });
  } catch (error) {
    console.log(error);
    res.render("employee/addEmployee.hbs", {
      errorMessage: error.message,
      employeeName: req.body.employeeName,
      companies,
    });
  }
};
