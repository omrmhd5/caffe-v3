const Employee = require("../../models/employee");
const {
  NotFoundException,
  BadRequestException,
} = require("../common/errors/exceptions");
const PAGE_SIZE = require("../common/constants").PAGE_SIZE;
const getId = require("../common/idGenerator").getId;

exports.getAllEmployees = (
  user,
  companyID = null,
  branchID = null,
  status = null
) => {
  let find = {};

  find.companyID = user.companyID;

  if (branchID) {
    find.branchID = branchID;
  }
  if (status) {
    find.status = status;
  }
  return Employee.find(find);
};

exports.getAllEmployeesWithPagination = async (
  user,
  companyID = null,
  branchID = null,
  status = null,
  page
) => {
  let find = {};

  find.companyID = user.companyID._id;

  if (branchID) {
    find.branchID = branchID;
  }

  if (status) {
    find.status = status;
  }

  let employees = await Employee.find(find)
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .populate("branchID")
    .populate("companyID")
    .sort("branchID")
    .lean();

  for (let employee of employees) {
    if (employee.status === "working") {
      employee.statusMessage = "يعمل";
    } else if (employee.status === "holiday") {
      employee.statusMessage = "في إجازة";
    } else if (employee.status === "notWorking") {
      employee.statusMessage = "انتهت خدمته";
    }
  }

  return employees;
};

exports.getCount = (user, companyID = null, branchID = null, status = null) => {
  let find = {};

  find.companyID = user.companyID;

  if (branchID) {
    find.branchID = branchID;
  }
  if (status) {
    find.status = status;
  }

  return Employee.countDocuments(find);
};

exports.getEmployeeById = async (id) => {
  const employee = await Employee.findById(id).populate("branchID").lean();
  if (!employee) {
    throw new NotFoundException("الموظف غير موجود");
  }

  if (employee.status === "working") {
    employee.statusMessage = "يعمل";
  } else if (employee.status === "holiday") {
    employee.statusMessage = "في إجازة";
  } else if (employee.status === "notWorking") {
    employee.statusMessage = "لا يعمل";
  }

  return employee;
};

exports.updateEmployee = async (
  id,
  employeeName = null,
  status = null,
  branchID = null
) => {
  let employee = await Employee.findById(id).populate("branchID").lean();
  if (!employee) {
    throw new NotFoundException("الموظف غير موجود");
  }

  let update = {};
  if (employeeName) {
    update.employeeName = employeeName;
    let duplicate = await Employee.findOne({ _id: { $ne: id }, employeeName });
    if (duplicate) {
      throw new BadRequestException("اسم الموظف موجود");
    }
  }
  if (status) {
    update.status = status;
  }
  if (branchID) {
    update.branchID = branchID;
  }

  employee = await Employee.findByIdAndUpdate(id, update, {
    new: true,
  }).populate("branchID");
  if (employee.status === "working") {
    employee.statusMessage = "يعمل";
  } else if (employee.status === "holiday") {
    employee.statusMessage = "في إجازة";
  } else if (employee.status === "notWorking") {
    employee.statusMessage = "لا يعمل";
  }

  return employee;
};

exports.deleteEmployee = async (id) => {
  const employee = await Employee.findById(id);
  if (!employee) {
    throw new NotFoundException("الموظف غير موجود");
  }

  //TODO: check salary
  await Employee.findByIdAndDelete(id);
  return "تم حذف الموظف بنجاح";
};

exports.createEmployee = async (employeeName, branchID, companyID) => {
  let employeeID = getId();
  if (!employeeName) {
    throw new BadRequestException("الرجاء كتابةاسم الموظف");
  }

  if (!companyID) {
    throw new BadRequestException("الرجاء اختيار الشركة");
  }

  if (!branchID) {
    throw new BadRequestException("الرجاء اختيار الفرع");
  }

  const employee = await Employee.findOne({
    employeeName,
    branchID,
    companyID,
  });

  if (employee) {
    throw new BadRequestException("يوجد موظف بنفس الاسم");
  }

  await Employee.create({ employeeID, employeeName, branchID, companyID });
  return;
};

exports.getEmployeeByName = async (employeeName) => {
  return Employee.findOne({ employeeName });
};

// Check if employee's branch is hidden
exports.isEmployeeBranchHidden = async (employeeID) => {
  const employee = await Employee.findById(employeeID);
  if (!employee) {
    throw new NotFoundException("الموظف غير موجود");
  }

  const Branch = require("../../models/branch");
  const branch = await Branch.findById(employee.branchID);

  if (branch && branch.hidden) {
    return true;
  }

  return false;
};

// Get all employees affected by a branch being hidden
exports.getEmployeesByBranch = async (branchID) => {
  return Employee.find({ branchID }).populate("branchID").populate("companyID");
};

// Check if any employees are affected by branch being hidden
exports.checkBranchEmployees = async (branchID) => {
  const employees = await Employee.find({ branchID });
  return employees.length > 0;
};

// Get all employees affected by a company being hidden
exports.getEmployeesByCompany = async (companyID) => {
  return Employee.find({ companyID })
    .populate("branchID")
    .populate("companyID");
};

// Check if any employees are affected by company being hidden
exports.checkCompanyEmployees = async (companyID) => {
  const employees = await Employee.find({ companyID });
  return employees.length > 0;
};
