const Item = require("../../models/item");
const Store = require("../../models/store");
const Sales = require("../../models/sales");
const {
  NotFoundException,
  BadRequestException,
  UnauthenticatedException,
} = require("../common/errors/exceptions");
const storeService = require("../store/service");
const PAGE_SIZE = require("../common/constants").PAGE_SIZE;

exports.getAllItems = (branchID = null, isSpecial, isHidden = null) => {
  let find = {};
  if (branchID) {
    find.branchID = branchID;
  }

  if (isSpecial != null) {
    find.isSpecial = isSpecial;
  }

  return Item.find(find)
    .populate("branchID")
    .collation({ locale: "ar", strength: 2 })
    .sort({ itemName: 1 })
    .lean();
};

exports.getAllItemsWithPagination = (branchID = null, page) => {
  let find = {};

  if (!branchID) {
    return [];
  }

  find.branchID = branchID;

  return Item.find(find)
    .populate("branchID")
    .collation({ locale: "ar", strength: 2 })
    .sort({ itemName: 1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE);
};

exports.getCount = (branchID = null) => {
  if (!branchID) {
    return Item.countDocuments();
  }
  return Item.countDocuments({ branchID });
};

exports.getItemById = async (id) => {
  const item = await Item.findById(id)
    .populate("branchID")
    .populate("specialItems.itemID");
  if (!item) {
    throw new NotFoundException("الصنف غير موجود");
  }

  return item;
};

exports.deleteItem = async (id) => {
  const deletedItem = await Item.findById(id);
  if (!deletedItem) {
    throw new NotFoundException("الصنف غير موجود");
  }

  const items = await Item.find({ branchID: deletedItem.branchID, isSpecial: true });
  for (let item of items) {
    for (let specialItem of item.specialItems) {
      if (specialItem.itemID.toString() == deletedItem._id.toString()) {
        throw new BadRequestException(`هذا الصنف من مكونات ${item.itemName} لذا لا يمكن حذفه`);
      }
    }
  }

  await Item.findByIdAndDelete(id);
  await Store.findOneAndDelete({
    itemID: id,
  });
  await Sales.deleteMany({
    itemID: id,
  });
};

exports.createItem = async (
  branchID,
  itemName,
  itemPrice,
  isSpecial,
  specialItems
) => {
  if (!itemName) {
    throw new BadRequestException("الرجاء كتابةاسم الصنف");
  }

  if (!branchID) {
    throw new BadRequestException("الرجاء اختيار الفرع");
  }

  const item = await Item.findOne({
    itemName,
    branchID,
    isSpecial: isSpecial ? true : false,
  });
  if (item) {
    throw new BadRequestException("يوجد صنف بنفس الاسم");
  }

  if (!isSpecial) {
    specialItems = [];
  }

  const createdItem = await Item.create({
    itemName,
    branchID,
    price: itemPrice,
    isSpecial: isSpecial ? true : false,
    specialItems,
  });

  if (!isSpecial) {
    await storeService.addNewStore(createdItem._id, branchID);
  }

  return;
};

exports.updateItem = async (
  id,
  branchID,
  itemName,
  itemPrice,
  isSpecial,
  isHidden,
  specialItems
) => {
  let item = await Item.findById(id).populate("branchID").lean();
  if (!item) {
    throw new NotFoundException("الصنف غير موجود");
  }

  let update = {};
  if (itemName) {
    update.itemName = itemName;
    let duplicate = await Item.findOne({
      _id: { $ne: id },
      itemName,
    });
    if (duplicate) {
      throw new BadRequestException("اسم الصنف موجود");
    }
  }

  if (branchID) {
    update.branchID = branchID;
  }

  if (itemPrice) {
    update.price = itemPrice;
  }

  update.isHidden = isHidden;

  update.specialItems = specialItems;
  update.isSpecial = isSpecial;

  item = await Item.findByIdAndUpdate(id, update, {
    new: true,
  }).populate("branchID");

  return item;
};
