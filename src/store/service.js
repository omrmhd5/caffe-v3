const Store = require("../../models/store");
const { NotFoundException } = require("../common/errors/exceptions");
const PAGE_SIZE = 60;

exports.getData = async (branchID = null) => {
  let find = {};
  if (!branchID) {
    return [];
  }

  find.branchID = branchID;

  let data = await Store.find(find)
    .populate("branchID")
    .populate({
      path: "itemID",
      select: "_id itemName price",
    })
    .sort({ "itemID.itemName": 1 });

  return data;
};

exports.getDataWithPagination = async (branchID = null, page) => {
  let find = {};
  if (!branchID) {
    return [];
  }

  find.branchID = branchID;

  let data = await Store.find(find)
    .populate("branchID")
    .populate({
      path: "itemID",
      select: "_id itemName price",
      // options: {
      //   // collation: { locale: 'ar', strength: 2 },
      //   sort: { 'price': -1 }
      // }
    })
    .sort({ "itemID.itemName": 1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE);

  return data;
};

exports.getCount = (branchID = null) => {
  if (!branchID) {
    return Store.countDocuments();
  }
  return Store.countDocuments({ branchID });
};

exports.getStoreById = (id) => {
  return Store.findById(id).populate("itemID").populate("branchID");
};

exports.updateBoughtQuantity = async (id, qty, realCurrentQuantity) => {
  let store = await Store.findById(id);
  if (!store) {
    throw new NotFoundException(" الصنف غير موجود في المخزن");
  }

  let updatedQty = parseInt(qty) + store.boughtquantity;
  let currnetQty = parseInt(updatedQty) - parseInt(store.soldquantity);

  store = await Store.findByIdAndUpdate(
    id,
    {
      boughtquantity: updatedQty,
      currentquantity: currnetQty,
      shortage: currnetQty - realCurrentQuantity,
      realcurrentquantity: realCurrentQuantity,
    },
    {
      new: true,
    }
  )
    .populate("itemID")
    .populate("branchID");

  return store;
};

// exports.updateSoldQuantity = async (itemID, qty) => {
//   let store = await Store.findOne({itemID});
//   if (!store) {
//     throw new NotFoundException(" الصنف غير موجود في المخزن");
//   }

//   let soldQuantity = parseInt(qty) + store.soldquantity;
//   let currentQuantity = store.boughtquantity - soldQuantity;

//   await Store.findOneAndUpdate( {itemID}, {
//     soldquantity: soldQuantity,
//     currentquantity: currentQuantity
//   });

//   return store;
// };

exports.updateSoldQuantity = async (itemID, newQty, oldQty = 0) => {
  let store = await Store.findOne({ itemID });
  if (!store) {
    return;
  }

  const soldQuantity = store.soldquantity + parseInt(newQty) - parseInt(oldQty);
  const currentQuantity = store.boughtquantity - soldQuantity;
  const shortage = currentQuantity - store.realcurrentquantity;

  await Store.findOneAndUpdate(
    { itemID },
    {
      soldquantity: soldQuantity,
      currentquantity: currentQuantity,
      shortage,
    }
  );

  return store;
};

exports.addNewStore = async (itemID, branchID) => {
  await Store.create({
    itemID,
    branchID,
    boughtquantity: 0,
    soldquantity: 0,
    currentquantity: 0,
  });
};

exports.getStoreByItemId = (itemID) => {
  return Store.findOne({
    itemID,
  })
    .populate("itemID")
    .populate("branchID");
};

exports.resetStore = async (branchID) => {
  await Store.updateMany(
    {
      branchID,
    },
    {
      boughtquantity: 0,
      soldquantity: 0,
      currentquantity: 0,
      realcurrentquantity: 0,
      shortage: 0,
    }
  );
};

exports.getShortageValueTotal = async (branchID) => {
  const stores = await Store.find({ branchID }).populate("itemID");
  let total = 0;
  for (let store of stores) {
    total += store.itemID.price * store.shortage;
  }

  return total;
};
