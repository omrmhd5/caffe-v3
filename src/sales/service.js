const moment = require("moment");
const Sales = require("../../models/sales");
const Item = require("../../models/item");
const storeService = require("../store/service");
const branchService = require("../branch/service");
const itemService = require("../item/service");

const {
  NotFoundException,
  BadRequestException,
} = require("../common/errors/exceptions");
const dateUtility = require("../common/date");
const PAGE_SIZE = require("../common/constants").PAGE_SIZE;

exports.getAllSales = (branchID = null, fromDate = null, toDate = null) => {
  let find = {};

  if (!branchID) {
    return [];
  }

  find.branchID = branchID;

  if (fromDate && toDate) {
    toDate = new Date(toDate);
    toDate.setDate(toDate.getDate() + 1);

    find.time = {
      $gte: new Date(fromDate),
      $lte: new Date(toDate),
    };
  }

  return Sales.find(find).populate("itemID").lean();
};

exports.getAllSalesWithPagination = (
  branchID = null,
  fromDate = null,
  toDate = null,
  page
) => {
  let find = {};
  if (!branchID) {
    return [];
  }

  find.branchID = branchID;

  if (fromDate && toDate) {
    toDate = new Date(toDate);
    toDate.setDate(toDate.getDate() + 1);

    find.time = {
      $gte: new Date(fromDate),
      $lte: new Date(toDate),
    };
  }

  return Sales.find(find)
    .populate("itemID")
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE);
};

exports.getCount = (branchID = null, fromDate = null, toDate = null) => {
  let find = {};
  if (branchID) {
    find.branchID = branchID;
  }

  if (fromDate && toDate) {
    find.time = {
      $gt: fromDate,
      $lt: toDate,
    };
  }

  return Sales.countDocuments(find);
};

exports.getSalesById = async (id) => {
  let sales = await Sales.findById(id).populate("itemID").populate("branchID");
  if (!sales) {
    throw new NotFoundException("المبيعات غير موجودة");
  }
  return sales;
};

exports.updateSalesTime = async (id, time) => {
  sales = await Sales.findByIdAndUpdate(id, { time });
  return;
};

exports.updateSalesBoughtquantity = async (id, boughtQuantity) => {
  let sales = await Sales.findById(id).populate("itemID").lean();
  if (!sales) {
    throw new NotFoundException(" غير موجود");
  }

  let updatedQty = boughtQuantity - sales.boughtquantity;

  await storeService.updateSoldQuantity(sales.itemID, updatedQty);

  sales = await Sales.findByIdAndUpdate(
    id,
    {
      boughtquantity: boughtQuantity,
      totalprice: sales.price * boughtQuantity,
    },
    {
      new: true,
    }
  )
    .populate("itemID")
    .populate("branchID");

  return sales;
};

exports.deleteSales = async (id) => {
  let sales = await Sales.findById(id).populate("itemID").lean();
  if (!sales) {
    throw new NotFoundException(" غير موجود");
  }

  let updatedQty = -sales.boughtquantity;
  let item = await Item.findById(sales.itemID);

  for (let specialItem of item.specialItems) {
    await storeService.updateSoldQuantity(
      specialItem.itemID,
      updatedQty * specialItem.qty
    );
  }
  await Sales.findByIdAndDelete(id);

  return "تم الحذف بنجاح";
};

exports.report = async (branchID, fromDate, toDate) => {
  if (!fromDate || !toDate) {
    return [];
  }

  fromDate = moment(fromDate).startOf("D");
  toDate = moment(toDate).endOf("D");

  let total = 0;
  let branch = await branchService.getBranchById(branchID);
  let res = await Sales.aggregate([
    {
      $project: {
        itemID: 1,
        price: 1,
        boughtquantity: 1,
        totalprice: 1,
        branchID: 1,
        time: 1,
      },
    },
    {
      $match: {
        branchID: branch._id,
        time: {
          $gte: fromDate.toDate(),
          $lte: toDate.toDate(),
        },
      },
    },
    {
      $group: {
        _id: "$itemID",
        boughtquantity: { $sum: "$boughtquantity" },
        totalprice: { $sum: "$totalprice" },
      },
    },
  ]);

  // let res2 = res.map(async sale => {
  for (let sale of res) {
    let item = await itemService.getItemById(sale._id);
    sale.itemName = item.itemName;
  }

  let result = await Sales.find({
    branchID,
    time: {
      $gte: fromDate,
      $lte: toDate,
    },
  }).populate("itemID");

  result.forEach((sale) => {
    total += sale.totalprice;
  });

  return { result: res, total };
};

exports.monthlyReport = async (branchID, fromDate, toDate) => {
  let data = [];
  if (!branchID || !fromDate || !toDate) {
    return data;
  }

  let loop = new Date(fromDate);
  toDate = new Date(toDate);

  let total = 0;

  while (loop <= toDate) {
    let dailyTotalPrice = 0;
    let endOfDay = moment(loop).endOf("D").toDate();

    let daily = await Sales.find({
      branchID,
      time: {
        $gte: loop,
        $lte: endOfDay,
      },
    });

    if (daily.length === 0) {
      data.push({
        date: loop.toLocaleString(),
        totalPrice: 0,
      });
    } else {
      daily.forEach((d) => {
        dailyTotalPrice += d.totalprice;
      });

      data.push({
        date: loop.toLocaleString(),
        totalPrice: dailyTotalPrice,
      });
    }

    loop = new Date(loop.setDate(loop.getDate() + 1));
    // loop = moment(loop).startOf("D").toDate();
    // loop.setHours(loop.getHours() + 3)

    total += dailyTotalPrice;
  }

  return { data, total };
};

exports.createMultipleSales = async (branchID, user, sales, date) => {
  if (new Date(date) <= new Date("2021-06-30")) {
    throw new BadRequestException("لا يمكن تعديل مبيعات أقدم من شهر 6");
  }

  let branch = await branchService.getBranchById(branchID);
  let today = moment(new Date(date));
  let oldSalesQty = 0;

  for (let sale of sales) {
    if (!sale.itemID) {
      continue;
    }

    let item = await itemService.getItemById(sale.itemID);
    if (!item) {
      continue;
    }

    let itemSale = await Sales.findOne({
      branchID: branch._id,
      itemID: sale.itemID,
      time: {
        $gte: today.startOf("day").toDate(),
        $lte: today.endOf("day").toDate(),
      },
    });

    if (itemSale != null) {
      oldSalesQty = itemSale.boughtquantity;
      await Sales.findByIdAndUpdate(itemSale._id, {
        time: today.endOf("day").toDate(),
        boughtquantity: sale.boughtquantity,
        totalprice: item.price * sale.boughtquantity,
      });
    } else {
      await Sales.create({
        branchID: branch._id,
        itemID: sale.itemID,
        time: today.endOf("day").toDate(),
        boughtquantity: sale.boughtquantity,
        price: item.price,
        totalprice: item.price * sale.boughtquantity,
      });
    }

    if (item.isSpecial) {
      for (let specialItem of item.specialItems) {
        await storeService.updateSoldQuantity(
          specialItem.itemID,
          specialItem.qty * sale.boughtquantity,
          specialItem.qty * oldSalesQty
        );
      }
    }

    await storeService.updateSoldQuantity(
      item._id,
      sale.boughtquantity,
      oldSalesQty
    );
  }

  return;
};

exports.getTotalByDate = async (user, branchID, date) => {
  let dayTotal = 0;

  let branch = await branchService.getBranchById(branchID);
  let today = moment(new Date(date));

  let todaySales = await Sales.find({
    branchID: branch._id,
    time: {
      $gte: today.startOf("day").toDate(),
      $lte: today.endOf("day").toDate(),
    },
  });

  for (let sale of todaySales) {
    dayTotal += parseInt(sale.totalprice);
  }

  return dayTotal;
};

exports.getItemsWithDateBoughtQty = async (
  user,
  branchID,
  date,
  isSpecial = false
) => {
  const returnedItems = [];
  let items = await itemService.getAllItems(branchID, true, false);
  const branch = await branchService.getBranchById(branchID);
  let today = moment(new Date(date));

  for (let item of items) {
    let results = await Sales.aggregate([
      {
        $project: {
          itemID: 1,
          price: 1,
          totalprice: 1,
          boughtquantity: 1,
          branchID: 1,
          time: 1,
        },
      },
      {
        $match: {
          branchID: branch._id,
          itemID: item._id,
          time: {
            $gte: today.startOf("day").toDate(),
            $lte: today.endOf("day").toDate(),
          },
        },
      },
      {
        $group: {
          _id: null,
          qtyTotal: { $sum: "$boughtquantity" },
        },
      },
    ]);

    item.boughtquantity = results[0] ? results[0].qtyTotal : 0;
    if (item.isHidden) {
      item.disabled = "disabled";
    }
    if (!item.boughtquantity == 0 || !item.isHidden) {
      returnedItems.push(item);
    }
  }

  return returnedItems;
};

exports.getEditDisabled = async (user) => {
  const currentHour = new Date().getHours();
  const isDisabled =
    currentHour >= 23 && user.role === "Cashier" ? true : false;

  return isDisabled;
};
