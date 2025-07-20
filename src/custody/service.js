const Custody = require("../../models/custody");
const User = require("../../models/user");
const CustodyRequest = require("../../models/custodyRequest");
const CustodyTransaction = require("../../models/custodyTransaction");
const branchService = require("../branch/service");
const {
  NotFoundException,
  BadRequestException,
} = require("../common/errors/exceptions");
const PAGE_SIZE = require("../common/constants").PAGE_SIZE;

exports.getAllCustodies = (branchID) => {
  if (!branchID) {
    return [];
  }

  return Custody.find({ branchID }).populate("branchID").lean();
};

exports.getAllCustodiesWithPagination = async (
  branchID = null,
  fromDate = null,
  toDate = new Date(),
  page
) => {
  let custodies = [];
  let find = {};

  if (!branchID) {
    return [];
  }

  find.branchID = branchID;

  if (fromDate && toDate) {
    find.receivedDate = {
      $gte: fromDate,
      $lte: toDate,
    };
  }

  custodies = await Custody.find(find)
    .populate("branchID")
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE);

  for (custody of custodies) {
    let result = await CustodyTransaction.aggregate([
      { $match: { custodyID: custody._id } },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: "$spentCount" },
          totalAdded: { $sum: "$addedCount" },
        },
      },
    ]);

    if (result[0]) {
      custody.spentCount = result[0].totalSpent;
      custody.totalCount = result[0].totalAdded;
      custody.remainingCount =
        result[0].totalAdded -
        result[0].totalSpent -
        custody.invalidItemsNumber;
    }
  }

  return custodies;
};

exports.getCount = (branchID = null, fromDate, toDate = new Date()) => {
  let find = {};
  if (!branchID) {
    return 0;
  }

  find.branchID = branchID;

  if (fromDate && toDate) {
    find.receivedDate = {
      $gt: fromDate,
      $lt: toDate,
    };
  }

  return Custody.countDocuments(find);
};

exports.getCustodyById = async (id) => {
  let custody = await Custody.findById(id).populate("branchID");
  if (!custody) {
    throw new NotFoundException("العهدة غير موجود");
  }

  let result = await CustodyTransaction.aggregate([
    { $match: { custodyID: custody._id } },
    {
      $group: {
        _id: null,
        totalSpent: { $sum: "$spentCount" },
        totalAdded: { $sum: "$addedCount" },
      },
    },
  ]);

  if (result[0]) {
    custody.spentCount = result[0].totalSpent;
    custody.totalCount = result[0].totalAdded;
    custody.remainingCount =
      result[0].totalAdded - result[0].totalSpent - custody.invalidItemsNumber;
  }

  return custody;
};

exports.getCustodyByBranchId = async (branchID) => {
  const custody = await Custody.find({ branchID }).populate("branchID");
  if (!custody) {
    throw new NotFoundException("العهدة غير موجود");
  }

  return custody;
};

exports.deleteCustody = async (id) => {
  const custody = await Custody.findById(id);
  if (!custody) {
    throw new NotFoundException("العهدة غير موجود");
  }

  await Custody.findByIdAndDelete(id);
  await CustodyTransaction.deleteMany({
    custodyID: id,
  });
  await CustodyRequest.deleteMany({
    custodyID: id,
  });

  return;
};

exports.createCustody = async (
  branchID,
  custodyName,
  expireDate,
  warrantyYears,
  invalidItemsNumber,
  count,
  userID
) => {
  if (!custodyName) {
    throw new BadRequestException("الرجاء كتابةاسم الصنف");
  }

  if (!branchID) {
    throw new BadRequestException("الرجاء اختيار الفرع");
  }

  const custody = await Custody.findOne({ name: custodyName, branchID });
  if (custody) {
    throw new BadRequestException("يوجد العهدة بنفس الاسم");
  }

  const today = new Date();
  const tomorrow = new Date(today);

  tomorrow.setDate(tomorrow.getDate() + 1);

  if (expireDate && new Date(expireDate) < tomorrow) {
    throw new BadRequestException(" تاريخ الانتهاء غير صالح ");
  }

  let receivedDate = new Date();

  let result = await Custody.create({
    branchID,
    name: custodyName,
    receivedDate,
    invalidItemsNumber,
    warranty: warrantyYears ? true : false,
    warrantyYears,
    expire: expireDate ? true : false,
    expireDate,
  });

  await CustodyTransaction.create({
    userID,
    custodyID: result._id,
    addedCount: count,
  });

  return;
};

exports.updateCustody = async (
  id,
  branchID = null,
  name,
  expire,
  expireDate,
  warranty,
  warrantyYears,
  invalidItemsNumber,
  count,
  userID
) => {
  let custody = await this.getCustodyById(id);
  const user = await User.findById(userID);

  if (!custody) {
    throw new NotFoundException("الصنف غير موجود");
  }

  if (count) {
    let totalCount = custody.totalCount;
    if (count < totalCount && user.role != "AccountantManager") {
      throw new BadRequestException("ليس لديك الصلاحية لإنقاص عدد العهدة");
    }

    let transactionCount = count - totalCount;
    await CustodyTransaction.create({
      userID,
      custodyID: id,
      addedCount: transactionCount,
    });
  }

  let update = {};
  if (name) {
    update.name = name;
    let duplicate = await Custody.findOne({
      _id: { $ne: id },
      name,
    });

    if (duplicate) {
      throw new BadRequestException("اسم العهدة مستخدم");
    }
  }

  if (branchID) {
    update.branchID = branchID;
  }

  if (warranty) {
    update.warranty = true;
    update.warrantyYears = warrantyYears ? warrantyYears : 0;
  } else {
    update.warranty = false;
    update.warrantyYears = 0;
  }

  if (expire) {
    update.expire = true;
    update.expireDate = expireDate;
  } else {
    update.expire = false;
    update.expireDate = null;
  }

  if (invalidItemsNumber) {
    update.invalidItemsNumber = invalidItemsNumber;
  }

  await Custody.findByIdAndUpdate(id, update);

  custody = await this.getCustodyById(id);

  return custody;
};
