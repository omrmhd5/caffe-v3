const PAGE_SIZE = require("../common/constants").PAGE_SIZE;
const custodyService = require("./service");
const branchService = require("../branch/service");

exports.getAllCustodies = async (req, res) => {
  let branchID = null;
  let fromDate = null;
  let toDate = null;
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

  if (req.query.fromDate) {
    fromDate = req.query.fromDate;
  }
  if (req.query.toDate) {
    toDate = req.query.toDate;
  }

  let custodies = await custodyService.getAllCustodiesWithPagination(
    branchID,
    fromDate,
    toDate,
    page
  );

  let count = await custodyService.getCount(branchID, fromDate, toDate);
  count < PAGE_SIZE ? (count = 1) : (count = count);

  res.render("custody/viewCustodies.hbs", {
    branches,
    custodies,
    branchID,
    fromDate,
    toDate,
    branchedRole: req.user.branchedRole,
    pagination: {
      page,
      pageCount: Math.ceil(count / PAGE_SIZE),
    },
  });
};

exports.showAdd = async (req, res) => {
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

  res.render("custody/addCustody.hbs", {
    branches,
    branchID,
    branchedRole: req.user.branchedRole,
  });
};

exports.createCustody = async (req, res) => {
  let branches = await branchService.getAllBranches(req.user.companyID);

  if (req.user.branchedRole) {
    branchID = req.user.branchID;
  } else {
    branchID = req.body.branchID;
    branches = branches.map((branch) => {
      if (branch._id == branchID) {
        branch.selected = "selected";
      }
      return branch;
    });
  }

  const custodyName = req.body.custodyName;
  const expireDate = req.body.expireDate;
  const warrantyYears = req.body.warrantyYears;
  const count = req.body.count;
  const invalidItemsNumber = req.body.invalidItemsNumber;
  const userID = req.user._id;

  try {
    await custodyService.createCustody(
      branchID,
      custodyName,
      expireDate,
      warrantyYears,
      invalidItemsNumber,
      count,
      userID
    );

    res.render("custody/addCustody.hbs", {
      successMessage: "أضيفت العهدة بنجاح",
      branches,
      branchID,
      branchedRole: req.user.branchedRole,
    });
  } catch (error) {
    res.status(error.status).render("custody/addCustody.hbs", {
      custody: {
        custodyName,
        count,
        invalidItemsNumber,
      },
      errorMessage: error.message,
      branches,
      branchID,
      branchedRole: req.user.branchedRole,
    });
  }
};

exports.showEdit = async (req, res) => {
  const id = req.params.id;
  const custody = await custodyService.getCustodyById(id);
  let branches = await branchService.getAllBranches(req.user.companyID);
  let branchID = null;
  if (req.user.branchedRole) {
    branchID = req.user.branchID;
  }

  res.render("custody/editCustody.hbs", {
    custody,
    branches,
    branchID,
    branchedRole: req.user.branchedRole,
  });
};

exports.updateCustody = async (req, res) => {
  let custody = null;
  let branches = null;
  let branchID = null;

  try {
    const id = req.params.id;
    const name = req.body.custodyName;
    const expire = req.body.expire;
    const expireDate = req.body.expireDate;
    const warranty = req.body.warranty;
    const warrantyYears = req.body.warrantyYears;
    const count = req.body.count;
    const invalidItemsNumber = req.body.invalidItemsNumber;

    branchID = req.body.branchID;
    if (req.user.branchedRole) {
      branchID = req.user.branchID;
    }

    custody = await custodyService.getCustodyById(id);
    branches = await branchService.getAllBranches(req.user.companyID);

    custody = await custodyService.updateCustody(
      id,
      branchID,
      name,
      expire,
      expireDate,
      warranty,
      warrantyYears,
      invalidItemsNumber,
      count,
      req.user._id
    );

    res.render("custody/editCustody.hbs", {
      custody,
      branchedRole: req.user.branchedRole,
      branchID,
      branches,
      successMessage: "تم تعديل بينات الصنف",
    });
  } catch (error) {
    res.render("custody/editCustody.hbs", {
      custody,
      branches,
      branchedRole: req.user.branchedRole,
      branchID,
      errorMessage: error.message,
    });
  }
};

exports.deleteCustody = async (req, res) => {
  try {
    const id = req.params.id;
    await custodyService.deleteCustody(id);

    res.send({ message: "حُذِفَت العهدة بنجاح" });
  } catch (error) {
    console.log(error, error.status, error.message);
    res.status(error.status).send({ errorMessage: error.message });
  }
};
