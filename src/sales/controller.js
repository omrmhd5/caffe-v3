const moment = require("moment");
const {
  NotFoundException,
  BadRequestException,
  UnauthenticatedException,
} = require("../common/errors/exceptions");
const PAGE_SIZE = require("../common/constants").PAGE_SIZE;
const salesService = require("./service");
const branchService = require("../branch/service");

exports.getAllSales = async (req, res) => {
  let branchID = req.query.branchID;
  let fromDate = null;
  let toDate = null;
  let page = 1;

  let branches = await branchService.getAllBranches(req.user.companyID);
  if (branchID) {
    branches = branches.map((branch) => {
      if (branch._id == branchID) {
        branch.selected = "selected";
      }
      return branch;
    });
  }

  let branch = await branchService.getBranchById(branchID);

  if (req.query.p) {
    page = req.query.p;
  }
  if (req.query.fromDate) {
    fromDate = req.query.fromDate;
  }
  if (req.query.toDate) {
    toDate = req.query.toDate;
  }

  let sales = await salesService.getAllSalesWithPagination(
    branchID,
    fromDate,
    toDate,
    page
  );

  let printedData = await salesService.getAllSales(branchID, fromDate, toDate);

  let count = await salesService.getCount(branchID, fromDate, toDate);

  count < PAGE_SIZE ? (count = 1) : (count = count);

  res.render("sales/viewSales.hbs", {
    fromDate,
    toDate,
    branch,
    branches,
    sales,
    branchID,
    printedData,
    pagination: {
      page,
      pageCount: Math.ceil(count / PAGE_SIZE),
    },
  });
};

exports.showEdit = async (req, res) => {
  const id = req.params.id;
  const sales = await salesService.getSalesById(id);

  res.render("sales/editSales.hbs", { sales });
};

exports.updateSales = async (req, res) => {
  let sales = null;
  let branches = null;
  try {
    const id = req.params.id;
    const boughtQuantity = req.body.boughtQuantity;
    const time = req.body.time;

    sales = await salesService.getSalesById(id);
    branches = await branchService.getAllBranches(req.user.companyID);

    if (time) {
      await salesService.updateSalesTime(id, time);
    }

    sales = await salesService.updateSalesBoughtquantity(id, boughtQuantity);

    res.render("sales/editSales.hbs", {
      sales,
      branches,
      successMessage: "تم تعديل البيانات ",
    });
  } catch (error) {
    res.render("sales/editSales.hbs", {
      sales,
      branches,
      errorMessage: error.message,
    });
  }
};

exports.deleteSails = async (req, res) => {
  try {
    let id = req.params.id;
    let message = await salesService.deleteSales(id);

    res.send({ message });
  } catch (error) {
    console.log(error, error.status, error.message);
    res.status(error.status).send({ errorMessage: error.message });
  }
};

exports.addSales = async (req, res) => {
  let date = req.query.date;
  if (!date) {
    date = new Date().toLocaleDateString();
  }
  let branches = await branchService.getAllBranches(req.user.companyID);
  let branchID = null;
  let items = [];
  let branch = null;
  let dayTotal = 0;
  let disabled = false;

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

  if (branchID) {
    branch = await branchService.getBranchById(branchID);
    disabled = await salesService.getEditDisabled(req.user);
    if (date) {
      items = await salesService.getItemsWithDateBoughtQty(
        req.user,
        branchID,
        date,
        true
      );
      dayTotal = await salesService.getTotalByDate(req.user, branchID, date);
    }
  }

  res.render("sales/addSales.hbs", {
    items,
    branch,
    dayTotal,
    date,
    disabled,
    branches,
    branchedRole: req.user.branchedRole,
  });
};

exports.createSales = async (req, res) => {};

exports.createMultipleSales = async (req, res) => {
  try {
    const sales = JSON.parse(req.body.data);
    const date = JSON.parse(req.body.date);
    let branchID = JSON.parse(req.body.branchID);

    if (req.user.branchedRole) {
      branchID = req.user.branchID;
    }

    if (!branchID) {
      return res.send({ errorMessage: " الرجاء تحديد الفرع" });
    }

    await salesService.createMultipleSales(branchID, req.user, sales, date);
    res.send({ message: "أضيفت البيانات بنجاح" });
  } catch (error) {
    res.status(error.status).send({ errorMessage: error.message });
  }
};

exports.report = async (req, res) => {
  const branchID = req.user.branchID._id;
  const branch = await branchService.getBranchById(branchID);
  const fromDate = req.query.fromDate;
  const toDate = req.query.toDate;

  const { result, total } = await salesService.report(
    branchID,
    fromDate,
    toDate
  );

  res.render("sales/salesReport.hbs", {
    fromDate,
    toDate,
    sales: result,
    total,
    branchID,
    branch,
    branchedRole: req.user.branchedRole,
  });
};

exports.monthlyReport = async (req, res) => {
  const branchID = req.user.branchID._id;
  const branch = await branchService.getBranchById(branchID);
  const fromDate = req.query.fromDate;
  const toDate = req.query.toDate;

  const { data, total } = await salesService.monthlyReport(
    branchID,
    fromDate,
    toDate
  );
  res.render("sales/monthlyReport.hbs", {
    fromDate,
    toDate,
    sales: data,
    total,
    branch,
  });
};
