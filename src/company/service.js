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

exports.deleteCompany = async (id) => {
  const company = await Company.findById(id);

  if (!company) {
    throw new NotFoundException("الشركة غير موجودة");
  }

  await Company.findByIdAndDelete(id);
  return;
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
  company.hidden = true;
  company.hiddenFromDate = fromDate || new Date();
  await company.save();
  // Cascade hide to all branches
  const Branch = require("../../models/branch");
  await Branch.updateMany(
    { companyID: id },
    { $set: { hidden: true, hiddenFromDate: fromDate || new Date() } }
  );
  return company;
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

exports.updateRentHistory = async (id, value, fromDate) => {
  const company = await Company.findById(id);
  if (!company) throw new NotFoundException("الشركة غير موجودة");
  company.rentHistory.push({ value, fromDate });
  await company.save();
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
