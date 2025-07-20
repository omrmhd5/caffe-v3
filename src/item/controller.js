const {
  NotFoundException,
  BadRequestException,
  UnauthenticatedException,
} = require("../common/errors/exceptions");

const PAGE_SIZE = require("../common/constants").PAGE_SIZE;
const itemService = require("./service");
const branchService = require("../branch/service");

exports.getAllItems = async (req, res) => {
  let branchID = null;
  let branch = null;
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

  branch = await branchService.getBranchById(branchID);

  if (req.query.p) {
    page = req.query.p;
  }

  let items = await itemService.getAllItemsWithPagination(branchID, page);
  const printedData = await itemService.getAllItems(branchID);

  let count = await itemService.getCount(branchID);
  count < PAGE_SIZE ? (count = 1) : (count = count);

  res.render("item/viewItems.hbs", {
    branches,
    branch,
    items,
    printedData,
    branchID,
    pagination: {
      page,
      pageCount: Math.ceil(count / PAGE_SIZE),
    },
  });
};

exports.showAdd = async (req, res) => {
  const branches = await branchService.getAllBranches(req.user.companyID);
  const items = await itemService.getAllItems(null, false);

  res.render("item/addItem.hbs", { branches, items });
};

exports.createItem = async (req, res) => {
  let branches = await branchService.getAllBranches(req.user.companyID);
  let item = {};
  try {
    let branchID = null;
    if (req.body.branchID) {
      branchID = req.body.branchID;
      branches = branches.map((branch) => {
        if (branch._id == branchID) {
          branch.selected = "selected";
        }
        return branch;
      });
    }

    let isSpecial = req.body.hasSpecialItems ? true : false;
    let specialItemsCount = req.body.specialItemsCount;
    let itemName = req.body.itemName;
    let itemPrice = req.body.itemPrice;
    let specialItems = [];
    let itemIDs = req.body["itemID[]"];
    let qtys = req.body["qty[]"];
    item = {
      branchID,
      itemName,
      itemPrice,
      specialItemsCount,
    };

    if (specialItemsCount && specialItemsCount > 0) {
      const items = await itemService.getAllItems(branchID, false);
      return res.render("item/addSpecialItems.hbs", {
        items,
        item,
      });
    }

    if (itemIDs) {
      isSpecial = true;
      if (Array.isArray(itemIDs)) {
        for (let i = 0; i < itemIDs.length; i++) {
          specialItems.push({
            itemID: itemIDs[i],
            qty: qtys[i],
          });
        }
      } else {
        specialItems.push({
          itemID: itemIDs,
          qty: qtys,
        });
      }
    }

    await itemService.createItem(
      branchID,
      itemName,
      itemPrice,
      isSpecial,
      specialItems
    );

    res.render("item/addItem.hbs", {
      successMessage: "أضيف الصنف بنجاح",
      branches,
      item,
    });
  } catch (error) {
    console.log(error);
    res.status(error.status).render("item/addItem.hbs", {
      branches,
      item,
      errorMessage: error.message,
    });
  }
};

exports.showEdit = async (req, res) => {
  const id = req.params.id;
  const item = await itemService.getItemById(id);
  const items = await itemService.getAllItems(item.branchID, false);

  let branches = await branchService.getAllBranches(req.user.companyID);

  res.render("item/editItem.hbs", { item, branches, items });
};

exports.updateItem = async (req, res) => {
  let item = null;
  let branches = null;

  try {
    const id = req.params.id;
    const itemName = JSON.parse(req.body.itemName);
    const itemPrice = JSON.parse(req.body.itemPrice);
    const branchID = JSON.parse(req.body.branchID);
    const isSpecial = JSON.parse(req.body.isSpecial);
    const isHidden = JSON.parse(req.body.isHidden);
    const specialItems = JSON.parse(req.body.specialItems);

    item = await itemService.getItemById(id);
    branches = await branchService.getAllBranches(req.user.companyID);

    item = await itemService.updateItem(
      id,
      branchID,
      itemName,
      itemPrice,
      isSpecial,
      isHidden,
      specialItems
    );

    res.send({ message: "تم تعديل بيانات الصنف بنجاح" });
  } catch (error) {
    console.log(error);
    res.render("item/editItem.hbs", {
      item,
      branches,
      errorMessage: error.message,
    });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const id = req.params.id;
    await itemService.deleteItem(id);

    res.send({ message: "حذف الصنف بنجاح" });
  } catch (error) {
    console.log(error, error.status, error.message);
    res.status(error.status).send({ errorMessage: error.message });
  }
};
