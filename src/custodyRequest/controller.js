const PAGE_SIZE = require("../common/constants").PAGE_SIZE;
const requestService = require("./service");
const branchService = require("../branch/service");
const custodyService = require("../custody/service");
const CustodyTransaction = require("../../models/custodyTransaction");

exports.getAllRequests = async (req, res) => {
  let branchID = null;
  let page = 1;

  let branches = await branchService.getAllBranches(req.user.companyID);
  if (req.user.branchedRole) {
    branchID = req.user.branchID;
  } else {
    branchID = req.query.branchID;
    branches = branches.map((branch) => {
      if (branch._id == branchID) {
        branch.selected = "selected";
      }
      return branch;
    });
  }

  if (req.query.p) {
    page = req.query.p;
  }

  let requests = await requestService.getAllRequestsWithPagination(
    branchID,
    page
  );

  let count = await requestService.getCount(branchID);
  count < PAGE_SIZE ? (count = 1) : (count = count);

  res.render("custodyRequest/requestStatus.hbs", {
    branches,
    requests,
    branchID,
    branchedRole: req.user.branchedRole,
    pagination: {
      page,
      pageCount: Math.ceil(count / PAGE_SIZE),
    },
  });
};

exports.getAllRequestsStatus = async (req, res) => {
  let branchID = null;
  let page = 1;

  let branches = await branchService.getAllBranches(req.user.companyID);
  if (req.query.branchID) {
    branchID = req.query.branchID;
    branches = branches.map((branch) => {
      if (branch._id == branchID) {
        branch.selected = "selected";
      }
      return branch;
    });
  }

  if (req.query.p) {
    page = req.query.p;
  }

  let requests = await requestService.getAllRequestsWithPagination(
    branchID,
    page
  );

  let count = await requestService.getCount(branchID);
  count < PAGE_SIZE ? (count = 1) : (count = count);

  res.render("custodyRequest/requestStatus.hbs", {
    branches,
    requests,
    branchID,
    pagination: {
      page,
      pageCount: Math.ceil(count / PAGE_SIZE),
    },
  });
};

exports.acceptRequest = async (req, res) => {
  try {
    const id = req.params.id;
    await requestService.acceptRequest(id);

    res.send({ message: "تمت الموافقة بنجاح" });
  } catch (error) {
    res.status(error.status).send({ errorMessage: error.message });
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    const id = req.params.id;
    await requestService.rejectRequest(id);

    res.send({ message: "تم رفض الطلب" });
  } catch (error) {
    res.status(error.status).send({ errorMessage: error.message });
  }
};

exports.showAdd = async (req, res) => {
  let branchID = null;

  if (req.query.branchID) {
    branchID = req.query.branchID;
  } else {
    branchID = req.user.branchID;
  }

  const branch = await branchService.getBranchById(branchID);

  const custodies = await custodyService.getCustodyByBranchId(branchID);
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

    custody.spentCount = result[0].totalSpent;
    custody.totalCount = result[0].totalAdded;
    custody.remainingCount =
      result[0].totalAdded - result[0].totalSpent - custody.invalidItemsNumber;
  }

  res.render("custodyRequest/addRequest.hbs", { branch, custodies });
};

exports.createRequest = async (req, res) => {
  const branches = await branchService.getAllBranches(req.user.companyID);
  const branchID = req.body.branchID;
  const custodyID = req.body.custodyID.split(",")[1];
  const reason = req.body.reason;
  const spendCount = req.body.spendCount;
  const returnCount = req.body.returnCount;
  const userID = req.user._id;

  const custodies = await custodyService.getCustodyByBranchId(branchID);
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

    custody.spentCount = result[0].totalSpent;
    custody.totalCount = result[0].totalAdded;
    custody.remainingCount =
      result[0].totalAdded - result[0].totalSpent - custody.invalidItemsNumber;
  }

  try {
    await requestService.createRequest(
      branchID,
      custodyID,
      spendCount,
      returnCount,
      reason,
      userID
    );

    res.render("custodyRequest/addRequest.hbs", {
      successMessage: "أضيف الطلب بنجاح",
      branches,
      custodies,
      branch: {
        _id: branchID,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(error.status).render("custodyRequest/addRequest.hbs", {
      branches,
      branch: {
        _id: branchID,
      },
      request: {
        spendCount,
        returnCount,
        reason,
      },
      custodies,
      errorMessage: error.message,
    });
  }
};

exports.showEdit = async (req, res) => {
  const id = req.params.id;
  const request = await requestService.getRequestById(id);
  const custody = await custodyService.getCustodyById(request.custodyID);
  let branches = await branchService.getAllBranches(req.user.companyID);

  res.render("custodyRequest/editRequest.hbs", { request, custody, branches });
};

exports.updateRequest = async (req, res) => {
  let request = null;
  let custody = null;
  let branches = null;

  try {
    const id = req.params.id;
    const spendCount = req.body.spendCount;
    const returnCount = req.body.returnCount;
    const reason = req.body.reason;

    request = await requestService.getRequestById(id);
    custody = await custodyService.getCustodyById(request.custodyID);
    branches = await branchService.getAllBranches(req.user.companyID);

    request = await requestService.updateRequest(
      id,
      returnCount,
      spendCount,
      reason
    );

    res.render("custodyRequest/editRequest.hbs", {
      request,
      branches,
      custody,
      successMessage: "تم تعديل بينات الطلب",
    });
  } catch (error) {
    res.render("custodyRequest/editRequest.hbs", {
      request,
      branches,
      custody,
      errorMessage: error.message,
    });
  }
};

exports.deleteRequest = async (req, res) => {
  try {
    const id = req.params.id;
    await requestService.deleteRequest(id);

    res.send({ message: "حذف الطلب بنجاح" });
  } catch (error) {
    console.log(error, error.status, error.message);
    res.status(error.status).send({ errorMessage: error.message });
  }
};
