const fs = require("fs");
const Company = require("../../models/company");
const {
  NotFoundException,
  BadRequestException,
} = require("../common/errors/exceptions");
const PAGE_SIZE = require("../common/constants").PAGE_SIZE;

exports.getAllCompanies = (forDate = null) => {
  let query = {};
  if (forDate) {
    query.$or = [
      { hidden: { $ne: true } },
      { hiddenFromDate: { $exists: false } },
      { hiddenFromDate: { $gt: forDate } },
    ];
  }
  return Company.find(query).populate("branches").lean();
};

exports.getAllCompaniesWithPagination = (page) => {
  return Company.find({})
    .lean()
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .lean();
};

exports.getCount = () => {
  return Company.countDocuments({});
};

exports.getCompanyById = async (id) => {
  let company = await Company.findById(id);
  if (!company) {
    throw new NotFoundException("الشركة غير موجودة");
  }
  return company;
};

exports.createCompany = async (
  companyName,
  companyImage,
  phoneNumber,
  email,
  location,
  notes
) => {
  if (!companyName) {
    throw new BadRequestException("الرجاء كتابةاسم الشركة");
  }

  const company = await Company.findOne({ companyname: companyName });
  if (company) {
    throw new BadRequestException("توجد شركة بنفس الاسم");
  }

  if (companyImage) {
    companyImage = "uploads/" + companyImage.trim();
  }

  await Company.create({
    companyname: companyName,
    companyImage,
    phoneNumber,
    email,
    location,
    notes,
  });
  return "أضيفت بنجاح";
};

exports.updateCompany = async (
  id,
  companyName,
  companyImage,
  phoneNumber,
  email,
  location,
  notes
) => {
  let update = {};

  let company = await Company.findById(id);
  if (!company) {
    throw new NotFoundException("الشركة غير موجودة");
  }

  if (companyName) {
    const duplicate = await Company.findOne({
      _id: { $ne: id },
      companyname: companyName,
    });

    if (duplicate) {
      throw new BadRequestException("توجد شركة بنفس الاسم");
    }

    update.companyname = companyName;
  }

  if (companyImage) {
    fs.unlink("public/" + company.companyImage, (err) => {
      if (err) {
        console.error(err);
        return;
      }
    });

    update.companyImage = "uploads/" + companyImage.trim();
  }

  if (phoneNumber) {
    update.phoneNumber = phoneNumber;
  }

  if (email) {
    update.email = email;
  }

  if (location) {
    update.location = location;
  }

  if (notes) {
    update.notes = notes;
  }

  company = await Company.findByIdAndUpdate(id, update, { new: true });
  return company;
};

exports.hideCompany = async (id, fromDate) => {
  const company = await Company.findById(id);
  if (!company) throw new NotFoundException("الشركة غير موجودة");

  // Check for affected users and employees
  const userService = require("../user/service");
  const employeeService = require("../employee/service");

  const affectedUsers = await userService.checkCompanyUsers(id);
  const affectedEmployees = await employeeService.checkCompanyEmployees(id);

  company.hidden = true;
  company.hiddenFromDate = fromDate || new Date();
  await company.save();

  // Cascade hide to all branches
  const Branch = require("../../models/branch");
  await Branch.updateMany(
    { companyID: id },
    { $set: { hidden: true, hiddenFromDate: fromDate || new Date() } }
  );

  return {
    company,
    affectedUsers,
    affectedEmployees,
  };
};

exports.unhideCompany = async (id) => {
  const company = await Company.findById(id);
  if (!company) throw new NotFoundException("الشركة غير موجودة");
  company.hidden = false;
  company.hiddenFromDate = null;
  await company.save();
  // Cascade unhide to all branches
  const Branch = require("../../models/branch");
  await Branch.updateMany(
    { companyID: id },
    { $set: { hidden: false, hiddenFromDate: null } }
  );
  return company;
};

exports.isCompanyEditable = async (id, date) => {
  const company = await Company.findById(id);
  if (!company) throw new NotFoundException("الشركة غير موجودة");
  if (
    company.hidden &&
    company.hiddenFromDate &&
    date >= company.hiddenFromDate
  ) {
    return false;
  }
  return true;
};

// Get detailed information about users and employees affected by company being hidden
exports.getCompanyImpactInfo = async (companyID) => {
  const userService = require("../user/service");
  const employeeService = require("../employee/service");

  const users = await userService.getUsersByCompany(companyID);
  const employees = await employeeService.getEmployeesByCompany(companyID);

  return {
    users: users.map((user) => ({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      role: user.role,
      blocked: user.blocked,
      branchID: user.branchID,
    })),
    employees: employees.map((employee) => ({
      _id: employee._id,
      employeeName: employee.employeeName,
      employeeID: employee.employeeID,
      status: employee.status,
      branchID: employee.branchID,
    })),
    totalUsers: users.length,
    totalEmployees: employees.length,
  };
};
