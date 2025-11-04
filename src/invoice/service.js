const _ = require("lodash");
const Invoice = require("../../models/invoice");
const branchService = require("../branch/service");
const financialService = require("../financial/service");

const {
  NotFoundException,
  BadRequestException,
} = require("../common/errors/exceptions");
const { getToDate } = require("../common/date");
const PAGE_SIZE = require("../common/constants").PAGE_SIZE;

exports.getAllInvoices = (branchID = null) => {
  if (branchID) {
    return Invoice.find({ branchID }).populate("branchID").lean();
  }
  return Invoice.find({}).populate("branchID").lean();
};

exports.getAllInvoicesWithPagination = (
  branchID,
  fromDate,
  toDate,
  warrantyStatus,
  page,
  taxStatus = 0
) => {
  let find = {};

  if (warrantyStatus == 1) {
    find.warranty = true;
  } else if (warrantyStatus == 2) {
    find.warranty = false;
  }

  if (taxStatus == 1) {
    find.$and = [
      { supplierTaxNumber: { $exists: true } },
      { supplierTaxNumber: { $ne: null } },
      { supplierTaxNumber: { $ne: "" } },
      { supplierTaxNumber: { $ne: " " } },
    ];
  } else if (taxStatus == 2) {
    find.$or = [
      { supplierTaxNumber: { $exists: false } },
      { supplierTaxNumber: { $eq: null } },
      { supplierTaxNumber: { $eq: "" } },
      { supplierTaxNumber: { $eq: " " } },
    ];
  }

  if (!branchID) {
    return [];
  }

  find.branchID = branchID;

  if (fromDate && toDate) {
    toDate = getToDate(toDate);

    find.date = {
      $gte: fromDate,
      $lte: toDate,
    };
  }

  return Invoice.find(find)
    .populate("branchID")
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .lean();
};

exports.getCount = (
  branchID = null,
  fromDate,
  toDate,
  warrantyStatus,
  description,
  taxStatus = 0
) => {
  let find = {};

  if (description) {
    find.$text = { $search: description };
  }

  if (!branchID) {
    return 0;
  }

  if (warrantyStatus == 1) {
    find.warranty = true;
  } else if (warrantyStatus == 2) {
    find.warranty = false;
  }

  if (taxStatus == 1) {
    find.$and = [
      { supplierTaxNumber: { $exists: true } },
      { supplierTaxNumber: { $ne: null } },
      { supplierTaxNumber: { $ne: "" } },
      { supplierTaxNumber: { $ne: " " } },
    ];
  } else if (taxStatus == 2) {
    find.$or = [
      { supplierTaxNumber: { $exists: false } },
      { supplierTaxNumber: { $eq: null } },
      { supplierTaxNumber: { $eq: "" } },
      { supplierTaxNumber: { $eq: " " } },
    ];
  }

  find.branchID = branchID;

  if (fromDate && toDate) {
    toDate = getToDate(toDate);

    find.date = {
      $gt: fromDate,
      $lt: toDate,
    };
  }

  return Invoice.countDocuments(find);
};

exports.getInvoiceBySerialNumber = async (branchID, serialNumber) => {
  const invoice = await Invoice.find({ branchID, serialNumber }).populate(
    "branchID"
  );
  return invoice;
};

exports.getInvoiceByDescription = async (
  branchID,
  description,
  warrantyStatus,
  page,
  fromDate,
  toDate,
  taxStatus = 0
) => {
  let find = {};

  if (description) {
    find.$text = { $search: description };
  }

  if (warrantyStatus == 1) {
    find.warranty = true;
  } else if (warrantyStatus == 2) {
    find.warranty = false;
  }

  if (taxStatus == 1) {
    find.$and = [
      { supplierTaxNumber: { $exists: true } },
      { supplierTaxNumber: { $ne: null } },
      { supplierTaxNumber: { $ne: "" } },
      { supplierTaxNumber: { $ne: " " } },
    ];
  } else if (taxStatus == 2) {
    find.$or = [
      { supplierTaxNumber: { $exists: false } },
      { supplierTaxNumber: { $eq: null } },
      { supplierTaxNumber: { $eq: "" } },
      { supplierTaxNumber: { $eq: " " } },
    ];
  }

  if (fromDate && toDate) {
    toDate = getToDate(toDate);

    find.date = {
      $gte: fromDate,
      $lte: toDate,
    };
  }

  find.branchID = branchID;

  const invoices = await Invoice.find(find)
    .sort({ date: -1 })
    .populate("branchID")
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE);

  return invoices;
};

exports.getInvoiceById = async (id) => {
  const invoice = await Invoice.findById(id).populate("branchID").lean();
  if (!invoice) {
    throw new NotFoundException("الفاتورة غير موجودة");
  }

  return invoice;
};

exports.deleteInvoice = async (id) => {
  const invoice = await Invoice.findById(id);
  if (!invoice) {
    throw new NotFoundException("الفاتورة غير موجودة");
  }

  await Invoice.findByIdAndDelete(id);

  await financialService.updateExpenses(invoice.branchID, invoice.date);

  return;
};

exports.createInvoice = async (
  branchID,
  warrantyYears,
  warranty,
  serialNumber,
  date,
  amount,
  totalAmount,
  taxRatio,
  taxValue,
  description,
  image,
  supplierTaxNumber,
  userID,
  supplierName,
  invoiceNumber
) => {
  if (!serialNumber) {
    throw new BadRequestException("الرجاء  إدخال الرقم القيد");
  }

  if (!branchID) {
    throw new BadRequestException("الرجاء اختيار الفرع");
  }

  if (!amount) {
    throw new BadRequestException("الرجاء إدخال القيمة");
  }

  if (
    taxValue &&
    taxValue > 0 &&
    (!supplierName || !invoiceNumber || !supplierTaxNumber)
  ) {
    throw new BadRequestException("الرجاء إدخال اسم المورد ورقم الفاتورة");
  }

  // Removed duplicate serial number validation - allowing duplicates

  // if ((!taxValue || taxValue < 0) && (supplierName || invoiceNumber || supplierTaxNumber)) {
  //   throw new BadRequestException(" الرجاء حذف اسم ورقم المورد ورقم الفاتورة أو إضافة قيمة الضريبة");
  // }

  const branch = await branchService.getBranchById(branchID);

  let invoices = await Invoice.aggregate([
    {
      $project: {
        year: { $year: "$date" },
        month: { $month: "$date" },
        registrationNumber: 1,
        branchID: 1,
      },
    },
    {
      $match: {
        month: new Date(date).getUTCMonth() + 1,
        year: new Date(date).getFullYear(),
        branchID: branch._id,
      },
    },
  ]);

  let registrationNumber =
    invoices.length > 0
      ? Math.max.apply(
          Math,
          invoices.map(function (inv) {
            return inv.registrationNumber;
          })
        )
      : 0;

  registrationNumber = registrationNumber + 1;

  await Invoice.create({
    branchID,
    warranty: warrantyYears ? true : false,
    warrantyYears,
    serialNumber,
    registrationNumber,
    date,
    amount,
    totalAmount,
    taxRatio,
    taxValue,
    description,
    image,
    supplierTaxNumber,
    supplierName,
    invoiceNumber,
  });

  await financialService.updateExpenses(branchID, date, userID);
  return;
};

exports.updateInvoice = async (
  id,
  warrantyYears,
  serialNumber,
  date,
  amount,
  totalAmount,
  taxRatio,
  taxValue,
  description,
  image,
  supplierTaxNumber,
  supplierName,
  invoiceNumber
) => {
  let invoice = await Invoice.findById(id).populate("branchID").lean();

  let update = {};
  if (warrantyYears) {
    update.warrantyYears = warrantyYears;
    update.warranty = warrantyYears > 0 ? true : false;
  }

  if (serialNumber) {
    // Removed duplicate serial number validation - allowing duplicates
    update.serialNumber = serialNumber;
  }

  if (date) {
    update.date = date;
  }

  if (amount) {
    update.amount = amount;
  }

  if (totalAmount) {
    update.totalAmount = totalAmount;
  }

  if (taxRatio) {
    update.taxRatio = taxRatio;
  }

  if (taxValue) {
    update.taxValue = taxValue;
  }

  if (description) {
    update.description = description;
  }

  if (image) {
    update.image = image;
  }

  if (
    taxValue &&
    taxValue > 0 &&
    (!supplierName || !invoiceNumber || !supplierTaxNumber)
  ) {
    throw new BadRequestException("الرجاء إدخال اسم المورد ورقم الفاتورة");
  }

  if ((!taxValue || taxValue <= 0) && (supplierName || supplierTaxNumber)) {
    throw new BadRequestException(
      " الرجاء حذف اسم ورقم المورد ورقم الفاتورة أو إضافة قيمة الضريبة"
    );
  }

  update.supplierTaxNumber = supplierTaxNumber;
  update.supplierName = supplierName;
  update.invoiceNumber = invoiceNumber;

  invoice = await Invoice.findByIdAndUpdate(id, update, {
    new: true,
  }).populate("branchID");

  await financialService.updateExpenses(invoice.branchID, invoice.date);

  return invoice;
};

exports.getAllInvoicesForExport = async (
  branchID,
  fromDate,
  toDate,
  warrantyStatus,
  taxStatus = 0,
  description = null
) => {
  let find = {};

  if (warrantyStatus == 1) {
    find.warranty = true;
  } else if (warrantyStatus == 2) {
    find.warranty = false;
  }

  if (taxStatus == 1) {
    find.$and = [
      { supplierTaxNumber: { $exists: true } },
      { supplierTaxNumber: { $ne: null } },
      { supplierTaxNumber: { $ne: "" } },
      { supplierTaxNumber: { $ne: " " } },
    ];
  } else if (taxStatus == 2) {
    find.$or = [
      { supplierTaxNumber: { $exists: false } },
      { supplierTaxNumber: { $eq: null } },
      { supplierTaxNumber: { $eq: "" } },
      { supplierTaxNumber: { $eq: " " } },
    ];
  }

  if (!branchID) {
    return [];
  }

  find.branchID = branchID;

  if (fromDate && toDate) {
    toDate = getToDate(toDate);

    find.date = {
      $gte: fromDate,
      $lte: toDate,
    };
  }

  if (description) {
    find.$text = { $search: description };
  }

  return await Invoice.find(find)
    .populate("branchID")
    .sort({ date: 1 })
    .lean();
};

exports.getReport = async (
  branchID = null,
  fromDate,
  toDate,
  taxStatus = null
) => {
  let find = {};
  let total = 0;
  let taxTotal = 0;
  let invoicesTotal = 0;
  let invoices = [];
  let currentKey = null;

  if (taxStatus == 1) {
    find = {
      $and: [
        { supplierTaxNumber: { $exists: true } },
        { supplierTaxNumber: { $ne: null } },
        { supplierTaxNumber: { $ne: "" } },
        { supplierTaxNumber: { $ne: " " } },
      ],
    };
  }

  if (taxStatus == 2) {
    find = {
      $or: [
        { supplierTaxNumber: { $exists: false } },
        { supplierTaxNumber: { $eq: null } },
        { supplierTaxNumber: { $eq: "" } },
        { supplierTaxNumber: { $eq: " " } },
      ],
    };
  }

  if (branchID) {
    find.branchID = branchID;
  }

  if (fromDate && toDate) {
    toDate = getToDate(toDate);

    find.date = {
      $gte: fromDate,
      $lte: toDate,
    };
  } else {
    return { invoices, total };
  }

  let result = await Invoice.find(find)
    .sort({
      date: 1,
    })
    .populate("branchID");

  result.map((invoice) => {
    invoice.date = new Date(invoice.date).toLocaleDateString();
  });

  let filteredInvoices = _.groupBy(result, "date");
  let keys = Object.keys(filteredInvoices);
  for (let key of keys) {
    let dayInvoices = [];

    currentKey = key;
    let dayTotal = 0;
    let dayTaxTotal = 0;
    let dayInvoicesTotal = 0;

    let array = filteredInvoices[key];

    for (let invoice of array) {
      dayInvoicesTotal += invoice.amount;
      dayTaxTotal += invoice.taxValue;
      dayTotal += invoice.totalAmount;
      dayInvoices.push(invoice);
    }

    array.total = dayTotal;
    dayInvoices.push({ dayTotal, key: new Date(key) });

    invoices.push(dayInvoices);

    invoicesTotal += dayInvoicesTotal;
    taxTotal += dayTaxTotal;
    total += dayTotal;
  }

  return { invoices, total, invoicesTotal, taxTotal };
};
