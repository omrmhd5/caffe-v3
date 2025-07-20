const {
  NotFoundException,
  BadRequestException,
} = require("../common/errors/exceptions");

const PAGE_SIZE = require("../common/constants").PAGE_SIZE;
const storeService = require("./service");
const branchService = require("../branch/service");

exports.getSroreReport = async (req, res) => {
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

  let branch = await branchService.getBranchById(branchID);

  if (req.query.p) {
    page = req.query.p;
  }

  let store = await storeService.getDataWithPagination(branchID, page);
  const shortageValueTotal = await storeService.getShortageValueTotal(branchID);

  // This is used for printing, it should be done in a better way
  let printedData = await storeService.getData(branchID);

  let count = await storeService.getCount(branchID);
  count < PAGE_SIZE ? (count = 1) : (count = count);

  res.render("store/storeReport.hbs", {
    branches,
    store,
    branch,
    branchID,
    printedData,
    shortageValueTotal,
    pagination: {
      page,
      pageCount: Math.ceil(count / PAGE_SIZE),
    },
  });
};

exports.viewSroreData = async (req, res) => {
  let branchID = null;
  let canResetData = req.user.role == "Manager"; 

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

  const shortageValueTotal = await storeService.getShortageValueTotal(branchID);

  const branch = await branchService.getBranchById(branchID);
  const store = await storeService.getDataWithPagination(branchID);

  res.render("store/_viewStore.hbs", {
    branches,
    store,
    branch,
    branchID,
    canResetData,
    shortageValueTotal,
    branchedRole: req.user.branchedRole,
  });
};

exports.showEdit = async (req, res) => {
  try {
    const id = req.params.id;
    const store = await storeService.getStoreById(id);
    if (!store) {
      throw new NotFoundException(" الصنف غير موجود في المخزن");
    }

    res.render("store/editStore.hbs", {
      store,
    });
  } catch (error) {}
};

exports.updateBoughtQuantity = async (req, res) => {
  const id = req.params.id;
  let store = await storeService.getStoreById(id);

  try {
    qty = req.body.addedQuantity;

    if (req.user.role != "Manager" && qty < 0) {
      throw new BadRequestException("ليس لديك الصلاحية لإنقاص المخزون");
    }

    store = await storeService.updateBoughtQuantity(id, qty);
    const message = "تم تعديل الكمية بنجاح";

    res.render("store/editStore.hbs", {
      successMessage: message,
      store,
    });
  } catch (error) {
    res.status(error.status).render("store/editStore.hbs", {
      errorMessage: error.message,
      store,
    });
  }
};

exports.updateBoughtQuantityAjax = async (req, res) => {
  const data = JSON.parse(req.body.data);

  const id = data.itemID;
  const qty = data.addedQuantity;
  const realCurrentQuantity = data.realCurrentQuantity;

  const store = await storeService.getStoreByItemId(id);

  try {
    if (req.user.role != "Manager" && qty < 0) {
      throw new BadRequestException("ليس لديك الصلاحية لإنقاص المخزون");
    }

    await storeService.updateBoughtQuantity(store._id, qty, realCurrentQuantity);

    res.send({ message: "أضيفت البيانات بنجاح" });
  } catch (error) {
    console.log(error, error.status, error.message);
    res.status(error.status).send({ errorMessage: error.message });
  }
};

exports.resetStore = async (req, res) => {
  try {
    const branchID = req.params.id;
    if (req.user.role != "Manager") {
      throw new BadRequestException("ليس لديك الصلاحية ");
    }

    await storeService.resetStore(branchID);

    res.send({ message: "تم تصفير البيانات بنجاح" });
  } catch (error) {
    console.log(error, error.status, error.message);
    res.status(error.status).send({ errorMessage: error.message });
  }
};
