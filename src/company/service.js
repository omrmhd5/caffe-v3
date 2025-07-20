const fs = require("fs");
const Company = require("../../models/company");
const {
  NotFoundException,
  BadRequestException,
} = require("../common/errors/exceptions");
const PAGE_SIZE = require("../common/constants").PAGE_SIZE;

exports.getAllCompanies = () => {
  return Company.find({}).populate("branches").lean();
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
