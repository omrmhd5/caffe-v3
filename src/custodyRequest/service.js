const Custody = require("../../models/custody");
const CustodyTransaction = require("../../models/custodyTransaction");
const CustodyRequest = require("../../models/custodyRequest");
const custodyService = require("../custody/service");

const {
  NotFoundException,
  BadRequestException,
} = require("../common/errors/exceptions");
const PAGE_SIZE = require("../common/constants").PAGE_SIZE;

exports.getAllRequests = (branchID = null) => {
  let find = {};

  if (!branchID) {
    return [];
  }

  find.branchID = branchID;

  return CustodyRequest.find(find)
    .populate("branchID")
    .populate("custodyID")
    .lean();
};

exports.getAllRequestsWithPagination = async (branchID = null, page) => {
  let requests = [];
  let find = {};

  if (!branchID) {
    return [];
  }

  find.branchID = branchID;

  requests = await CustodyRequest.find(find)
    .populate("branchID")
    .populate("custodyID")
    .skip((page - 1) * PAGE_SIZE)
    .sort({ createdAt: -1 })
    .limit(PAGE_SIZE);

  if (requests.length > 0) {
    for (r of requests) {
      if (r.status === "waiting") {
        r.statusMessage = "بإنتظار الموافقة";
      } else if (r.status === "accepted") {
        r.statusMessage = " موافقة";
      } else if (r.status === "rejected") {
        r.statusMessage = "مرفوض";
      }
      if (r.status !== "waiting") {
        r.disabled = "disabled";
      } else {
        r.disabled = "";
      }

      let result = await CustodyTransaction.aggregate([
        { $match: { custodyID: r.custodyID._id } },
        {
          $group: {
            _id: null,
            totalSpent: { $sum: "$spentCount" },
            totalAdded: { $sum: "$addedCount" },
          },
        },
      ]);

      if (result[0]) {
        r.custodyID.spentCount = result[0].totalSpent;
        r.custodyID.totalCount = result[0].totalAdded;
        r.custodyID.remainingCount =
          result[0].totalAdded -
          result[0].totalSpent -
          r.custodyID.invalidItemsNumber;
      }
    }
  }

  return requests;
};

exports.getCount = (branchID = null) => {
  if (!branchID) {
    return 0;
  }
  return CustodyRequest.countDocuments({ branchID });
};

exports.getRequestById = async (id) => {
  const custody = await CustodyRequest.findById(id).populate("branchID");
  if (!custody) {
    throw new NotFoundException("العهدة غير موجود");
  }

  return custody;
};

exports.deleteRequest = async (id) => {
  const request = await CustodyRequest.findById(id);
  if (!request) {
    throw new NotFoundException("الطلب غير موجود");
  }

  await CustodyRequest.findByIdAndDelete(id);
  return;
};

exports.createRequest = async (
  branchID,
  custodyID,
  spendCount,
  returnCount = 0,
  reason,
  userID
) => {
  if (!custodyID) {
    throw new BadRequestException("الرجاء اختيار الصنف");
  }

  if (!branchID) {
    throw new BadRequestException("الرجاء اختيار الفرع");
  }

  let waitingRequest = await CustodyRequest.findOne({
    branchID,
    custodyID,
    status: "waiting",
  });


  if (waitingRequest) {
    throw new BadRequestException("يوجد طلب لنفس الصنف في الانتظار");
  }

  let custody = await custodyService.getCustodyById(custodyID);

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

  custody.spentCount = result[0].totalSpent;
  custody.totalCount = result[0].totalAdded;
  custody.remainingCount =
    result[0].totalAdded - result[0].totalSpent - custody.invalidItemsNumber;

  if (custody.remainingCount == 0) {
    throw new BadRequestException("هذا الصنف غير متوفر حاليا");
  }

  if (custody.remainingCount < spendCount) {
    throw new BadRequestException("الكمية المطلوبة غير متوفرة");
  }

  const request = new CustodyRequest({
    userID,
    branchID,
    custodyID,
    spendCount,
    returnCount,
    reason,
  });

  await request.save();

  return;
};

exports.updateRequest = async (id, returnCount, spendCount, reason) => {
  let request = await CustodyRequest.findById(id).populate("branchID").lean();
  if (!request) {
    throw new NotFoundException("الطلب غير موجود");
  }

  if (request.status !== "waiting") {
    throw new BadRequestException("لا يمكن تعديل الطلب في هذه الحالة");
  }

  let update = {};

  if (returnCount) {
    update.returnCount = returnCount;
  }

  if (spendCount) {
    update.spendCount = spendCount;
  }

  if (reason) {
    update.reason = reason;
  }

  request = await CustodyRequest.findByIdAndUpdate(id, update, {
    new: true,
  }).populate("branchID");

  return request;
};

exports.acceptRequest = async (id) => {
  let custodyRequest = await CustodyRequest.findOne({
    _id: id,
  }).populate("custodyID");

  if (custodyRequest.status !== "waiting") {
    throw new BadRequestException("لا يمكن قبول طلب في هذه الحالة");
  }

  if (custodyRequest.spendCount > custodyRequest.custodyID.count) {
    throw new BadRequestException("العدد المطلوب أكبر من المتوفر حاليا ");
  }

  if (custodyRequest.spendCount > 0) {
    await CustodyTransaction.create({
      custodyID: custodyRequest.custodyID._id,
      spentCount: custodyRequest.spendCount,
    });
  }

  if (custodyRequest.returnCount > 0) {
    await CustodyTransaction.create({
      custodyID: custodyRequest.custodyID._id,
      addedCount: custodyRequest.returnCount,
    });
  }

  await CustodyRequest.findByIdAndUpdate(id, {
    status: "accepted",
  });

  await Custody.findByIdAndUpdate(custodyRequest.custodyID, {
    $inc: { count: -custodyRequest.spendCount },
  });
};

exports.rejectRequest = async (id) => {
  let custodyRequest = await CustodyRequest.findOne({
    _id: id,
  }).populate("custodyID");

  if (custodyRequest.status !== "waiting") {
    throw new BadRequestException("لا يمكن رفض الطلب في هذه الحالة");
  }

  await CustodyRequest.findByIdAndUpdate(id, {
    status: "rejected",
  });
};
