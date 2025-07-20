const Branch = require("../../models/branch");
const {
  NotFoundException,
  BadRequestException,
  UnauthenticatedException,
} = require("../common/errors/exceptions");
const PAGE_SIZE = require("../common/constants").PAGE_SIZE;

exports.getAllBranches = (companyID = null) => {
  if (!companyID) {
    return [];
  }

  return Branch.find({ companyID }).populate("companyID");
};

exports.getAllBranchesWithPagination = (companyID = null, page) => {
  if (!companyID) {
    return [];
  }

  return Branch.find({ companyID })
    .populate("companyID")
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE);
};

exports.getCount = (companyID = null) => {
  if (!companyID) {
    return 0;
  }

  return Branch.countDocuments({ companyID });
};

exports.getBranchById = async (id) => {
  const branch = await Branch.findById(id);
  if (!branch) {
    return;
  }

  return branch;
};

exports.deleteBranch = async (id) => {
  const branch = await Branch.findById(id);
  if (!branch) {
    throw new NotFoundException("الفرع غير موجود");
  }

  await Branch.findByIdAndDelete(id);
  return;
};

exports.createBranch = async (branchName, companyID) => {
  if (!branchName) {
    throw new BadRequestException("الرجاء كتابةاسم الفرع");
  }

  if (!companyID) {
    throw new BadRequestException("الرجاء اختيار الشركة");
  }

  const branch = await Branch.findOne({ branchname: branchName, companyID });
  if (branch) {
    throw new BadRequestException("يوجد فرع بنفس الاسم");
  }

  await Branch.create({ branchname: branchName, companyID });
  return;
};

exports.updateBranch = async (id, branchName, companyID) => {
  let update = {};

  const branch = await Branch.findById(id);
  if (!branch) {
    throw new NotFoundException("الفرع غير موجود");
  }

  if (branchName) {
    const duplicate = await Branch.findOne({
      _id: { $ne: id },
      branchname: branchName,
      companyID,
    });
    if (duplicate) {
      throw new BadRequestException("يوجد فرع بنفس الاسم");
    }
    update.branchname = branchName;
  }

  if (companyID) {
    update.companyID = companyID;
  }

  return await Branch.findByIdAndUpdate(id, update, { new: true });
};
