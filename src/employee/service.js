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
  employeeID = null,
  status = null,
  branchID = null,
  nationality = null,
  idNumber = null,
  residencyExpiryDate = null
) => {
  let employee = await Employee.findById(id).populate("branchID").lean();
  if (!employee) {
    throw new NotFoundException("الموظف غير موجود");
  }

  let update = {};
  if (employeeName) {
    update.employeeName = employeeName;
  }
  if (employeeID) {
    update.employeeID = employeeID;
    let duplicate = await Employee.findOne({
      _id: { $ne: id },
      employeeID,
      companyID: employee.companyID,
    });
    if (duplicate) {
      throw new BadRequestException("رقم الموظف موجود");
    }
  }
  if (status) {
    update.status = status;
  }
  if (branchID) {
    update.branchID = branchID;
  }
  if (nationality) {
    update.nationality = nationality;
  }
  if (idNumber) {
    update.idNumber = idNumber;
  }
  if (residencyExpiryDate) {
    // Check if residency expiry date is in the future
    const expiryDate = new Date(residencyExpiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (expiryDate <= today) {
      throw new BadRequestException(
        "تاريخ انتهاء الإقامة يجب أن يكون في المستقبل"
      );
    }
    update.residencyExpiryDate = residencyExpiryDate;
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

exports.createEmployee = async (
  employeeName,
  employeeID,
  branchID,
  companyID,
  nationality,
  idNumber,
  residencyExpiryDate
) => {
  if (!employeeName) {
    throw new BadRequestException("الرجاء كتابةاسم الموظف");
  }

  if (!employeeID) {
    throw new BadRequestException("الرجاء كتابةرقم الموظف");
  }

  if (!companyID) {
    throw new BadRequestException("الرجاء اختيار الشركة");
  }

  if (!branchID) {
    throw new BadRequestException("الرجاء اختيار الفرع");
  }

  if (!nationality) {
    throw new BadRequestException("الرجاء كتابةالجنسية");
  }

  if (!idNumber) {
    throw new BadRequestException("الرجاء كتابةرقم الهوية/الإقامة");
  }

  if (!residencyExpiryDate) {
    throw new BadRequestException("الرجاء كتابةتاريخ انتهاء الإقامة");
  }

  // Check if residency expiry date is in the future
  const expiryDate = new Date(residencyExpiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (expiryDate <= today) {
    throw new BadRequestException(
      "تاريخ انتهاء الإقامة يجب أن يكون في المستقبل"
    );
  }

  const employee = await Employee.findOne({
    employeeID,
    companyID,
  });

  if (employee) {
    throw new BadRequestException("يوجد موظف بنفس الرقم");
  }

  await Employee.create({
    employeeID,
    employeeName,
    branchID,
    companyID,
    nationality,
    idNumber,
    residencyExpiryDate,
  });
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
