const Branch = require("../../models/branch");
const {
  NotFoundException,
  BadRequestException,
  UnauthenticatedException,
} = require("../common/errors/exceptions");
const PAGE_SIZE = require("../common/constants").PAGE_SIZE;

// Helper to get rent for a branch for a specific date
async function getRentForMonth(branch, date) {
  if (!branch.rentHistory || branch.rentHistory.length === 0) return 0;
  const d = new Date(date);
  // Find the most recent rent entry before or at the given date
  let best = null;
  for (const entry of branch.rentHistory) {
    if (entry.fromDate <= d && (!best || entry.fromDate > best.fromDate)) {
      best = entry;
    }
  }
  return best ? best.value : 0;
}

// Helper to get mada ratio for a branch for a specific date
async function getMadaRatioForMonth(branch, date) {
  if (!branch.madaRatioHistory || branch.madaRatioHistory.length === 0)
    return 0;
  const d = new Date(date);
  // Find the most recent mada ratio entry before or at the given date
  let best = null;
  for (const entry of branch.madaRatioHistory) {
    if (entry.fromDate <= d && (!best || entry.fromDate > best.fromDate)) {
      best = entry;
    }
  }
  return best ? best.value : 0;
}

exports.getAllBranches = (companyID = null, forDate = null) => {
  if (!companyID) {
    return [];
  }
  let query = { companyID };
  if (forDate) {
    query.$or = [
      { hidden: { $ne: true } },
      { hiddenFromDate: { $exists: false } },
      { hiddenFromDate: { $gt: forDate } },
    ];
  }
  return Branch.find(query).populate("companyID");
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

exports.hideBranch = async (id, fromDate) => {
  const branch = await Branch.findById(id);
  if (!branch) throw new NotFoundException("الفرع غير موجود");
  branch.hidden = true;
  branch.hiddenFromDate = fromDate || new Date();
  await branch.save();
  return branch;
};

exports.unhideBranch = async (id) => {
  const branch = await Branch.findById(id);
  if (!branch) throw new NotFoundException("الفرع غير موجود");
  branch.hidden = false;
  branch.hiddenFromDate = null;
  await branch.save();
  return branch;
};

exports.updateRentHistory = async (id, value, fromDate) => {
  const branch = await Branch.findById(id);
  if (!branch) throw new NotFoundException("الفرع غير موجود");
  // Remove all future rent history entries from this date forward
  branch.rentHistory = branch.rentHistory.filter(
    (entry) => new Date(entry.fromDate) < new Date(fromDate)
  );
  branch.rentHistory.push({ value, fromDate });
  await branch.save();
  return branch;
};

exports.updateMadaRatioHistory = async (id, value, fromDate) => {
  const branch = await Branch.findById(id);
  if (!branch) throw new NotFoundException("الفرع غير موجود");
  // Remove all future mada ratio history entries from this date forward
  branch.madaRatioHistory = branch.madaRatioHistory.filter(
    (entry) => new Date(entry.fromDate) < new Date(fromDate)
  );
  branch.madaRatioHistory.push({ value, fromDate });
  await branch.save();
  return branch;
};

exports.isBranchEditable = async (id, date) => {
  const branch = await Branch.findById(id);
  if (!branch) throw new NotFoundException("الفرع غير موجود");
  if (branch.hidden && branch.hiddenFromDate && date >= branch.hiddenFromDate) {
    return false;
  }
  return true;
};
