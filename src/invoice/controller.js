const excelJS = require("exceljs");

const {
  NotFoundException,
  UnauthorizedException,
} = require("../common/errors/exceptions");

const PAGE_SIZE = require("../common/constants").PAGE_SIZE;
const invoiceService = require("./service");
const branchService = require("../branch/service");
let warrantyStatuses = require("../common/constants").WARRANTY_STATUS;
let taxStatuses = require("../common/constants").TAX_STATUS;

exports.getAllInvoices = async (req, res) => {
  let branchID = null;
  let fromDate = null;
  let toDate = null;
  let taxStatus = 0;
  let page = 1;
  let invoices = null;
  let warrantyStatus = 0;
  let description = null;
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

  branch = await branchService.getBranchById(branchID);

  if (req.query.p) {
    page = req.query.p;
  }

  if (req.query.warrantyStatus) {
    warrantyStatus = req.query.warrantyStatus;
    warrantyStatuses = warrantyStatuses.map((status) => {
      if (status.value === warrantyStatus) {
        status.selected = "selected";
      } else {
        delete status.selected;
      }
      return status;
    });
  }

  if (req.query.taxStatus) {
    taxStatus = req.query.taxStatus;
    taxStatuses = taxStatuses.map((status) => {
      if (status.value === taxStatus) {
        status.selected = "selected";
      } else {
        delete status.selected;
      }
      return status;
    });
  }

  if (req.query.fromDate) {
    fromDate = req.query.fromDate;
  }

  if (req.query.toDate) {
    toDate = req.query.toDate;
  }

  if (req.query.description) {
    description = req.query.description;
  }

  if (description) {
    invoices = await invoiceService.getInvoiceByDescription(
      branchID,
      description,
      warrantyStatus,
      page,
      fromDate,
      toDate,
      taxStatus
    );
  } else {
    invoices = await invoiceService.getAllInvoicesWithPagination(
      branchID,
      fromDate,
      toDate,
      warrantyStatus,
      page,
      taxStatus
    );
  }

  const currentDate = new Date();

  invoices = invoices.map((invoice) => {
    const createdAt = new Date(invoice.createdAt);
    const minutesSinceCreation = parseInt((currentDate - createdAt) / 60000); // Minutes since creation

    // Only AccountantManager has full access, others have 5 hour limit for both edit and delete
    if (req.user.role === "AccountantManager") {
      invoice.canEdit = true;
      invoice.canDelete = true;
    } else {
      // For non-managers: 5 hour limit for both edit and delete
      invoice.canEdit = minutesSinceCreation <= 300;
      invoice.canDelete = minutesSinceCreation <= 300; // Same 5-hour deadline as edit
    }

    return invoice;
  });

  let count = await invoiceService.getCount(
    branchID,
    fromDate,
    toDate,
    warrantyStatus,
    description,
    taxStatus
  );
  count < PAGE_SIZE ? (count = 1) : (count = count);

  res.render("invoice/viewInvoices.hbs", {
    branches,
    invoices,
    fromDate,
    toDate,
    branchID,
    branch,
    branchedRole: req.user.branchedRole,
    warrantyStatuses: warrantyStatuses,
    taxStatuses: taxStatuses,
    warrantyStatus,
    taxStatus,
    description,
    pagination: {
      page,
      pageCount: Math.ceil(count / PAGE_SIZE),
    },
  });
};

exports.showAdd = async (req, res) => {
  let branchID = null;
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

  branch = await branchService.getBranchById(branchID);

  res.render("invoice/addInvoice.hbs", {
    branches,
    branchedRole: req.user.branchedRole,
    branchID,
  });
};

exports.createInvoice = async (req, res) => {
  let branches = await branchService.getAllBranches(req.user.companyID);
  let branchID = null;
  let image = null;
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

  let branch = await branchService.getBranchById(branchID);
  try {
    let warrantyYears = req.body.warrantyYears;
    let warranty = req.body.warranty;
    let serialNumber = req.body.serialNumber;
    let date = req.body.date;
    let amount = req.body.amount;
    let description = req.body.description;
    let totalAmount = req.body.totalAmount;
    let taxRatio = req.body.taxRatio;
    let taxValue = req.body.taxValue;
    let supplierTaxNumber = req.body.supplierTaxNumber;
    let invoiceNumber = req.body.invoiceNumber;
    let supplierName = req.body.supplierName;

    date = new Date(date);
    date.setHours(new Date().getHours());

    if (req.files.image) {
      image = "uploads/" + req.files.image[0].filename;
    }

    await invoiceService.createInvoice(
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
      req.user._id,
      supplierName,
      invoiceNumber
    );

    res.render("invoice/addInvoice.hbs", {
      successMessage: "أضيفت الفاتورة بنجاح",
      branches,
      branchedRole: req.user.branchedRole,
      branchID,
      branch,
    });
  } catch (error) {
    res.status(error.status).render("invoice/addInvoice.hbs", {
      branches,
      errorMessage: error.message,
      branchID,
      branch,
      branchedRole: req.user.branchedRole,
    });
  }
};

exports.showEdit = async (req, res) => {
  const id = req.params.id;
  const invoice = await invoiceService.getInvoiceById(id);

  res.render("invoice/editInvoice.hbs", { invoice });
};

exports.showInvoice = async (req, res) => {
  const id = req.params.id;
  const invoice = await invoiceService.getInvoiceById(id);

  const createdAt = new Date(invoice.createdAt);
  const currentDate = new Date();
  const minutesSinceCreation = parseInt((currentDate - createdAt) / 60000);

  // Only AccountantManager has full access, others have 5 hour limit for both edit and delete
  if (req.user.role === "AccountantManager") {
    invoice.canEdit = true;
    invoice.canDelete = true;
  } else {
    invoice.canEdit = minutesSinceCreation <= 300;
    invoice.canDelete = minutesSinceCreation <= 300; // Same 5-hour deadline as edit
  }

  res.render("invoice/showInvoice.hbs", { invoice });
};

exports.updateInvoice = async (req, res) => {
  let invoice = null;
  let branches = null;

  try {
    const id = req.params.id;
    let image = null;
    let warrantyYears = req.body.warrantyYears;
    let serialNumber = req.body.serialNumber;
    let date = req.body.date;
    let amount = req.body.amount;
    let description = req.body.description;
    let totalAmount = req.body.totalAmount;
    let taxRatio = req.body.taxRatio;
    let taxValue = req.body.taxValue;
    let supplierTaxNumber = req.body.supplierTaxNumber;
    let invoiceNumber = req.body.invoiceNumber;
    let supplierName = req.body.supplierName;

    if (req.files.image) {
      image = "uploads/" + req.files.image[0].filename;
    }

    invoice = await invoiceService.getInvoiceById(id);
    if (!invoice) {
      throw new NotFoundException("الفاتورة غير موجودة");
    }

    const createdAt = new Date(invoice.createdAt);
    const currentDate = new Date();
    const minutesSinceCreation = parseInt((currentDate - createdAt) / 60000);

    if (minutesSinceCreation > 300 && req.user.role !== "AccountantManager") {
      throw new UnauthorizedException(
        " ليس لديك الصلاحية لتعديل بيانات الفاتورة"
      );
    }

    branches = await branchService.getAllBranches(req.user.companyID);

    invoice = await invoiceService.updateInvoice(
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
    );

    res.render("invoice/editInvoice.hbs", {
      invoice,
      branches,
      successMessage: "تم تعديل بينات الفاتورة",
    });
  } catch (error) {
    res.render("invoice/editInvoice.hbs", {
      invoice,
      branches,
      errorMessage: error.message,
    });
  }
};

exports.deleteInvoice = async (req, res) => {
  try {
    const id = req.params.id;

    const invoice = await invoiceService.getInvoiceById(id);
    const createdAt = new Date(invoice.createdAt);
    const currentDate = new Date();
    const minutesSinceCreation = parseInt((currentDate - createdAt) / 60000);

    // Only AccountantManager has full access, others have 5 hour limit for delete
    if (req.user.role !== "AccountantManager" && minutesSinceCreation > 300) {
      throw new UnauthorizedException(
        " ليس لديك الصلاحية لحذف بيانات الفاتورة"
      );
    }

    await invoiceService.deleteInvoice(id);

    res.send({ message: "حذفت الفاتورة بنجاح" });
  } catch (error) {
    console.log(error, error.status, error.message);
    res.status(error.status).send({ errorMessage: error.message });
  }
};

exports.report = async (req, res) => {
  let branchID = null;
  let branch = null;
  let fromDate = null;
  let toDate = null;
  let taxStatus = 0;

  let branches = await branchService.getAllBranches(req.user.companyID);
  branches.unshift({
    //hardcode all @TODO find a better way to do this ??
    _id: null,
    branchname: "الكل",
    companyID: "61fb9a9055372857247e7bdc",
  });

  if (req.user.branchedRole) {
    branchID = req.user.branchID;
  } else if (req.query.branchID) {
    branchID = req.query.branchID;
    branches = branches.map((branch) => {
      if (branch._id == branchID) {
        branch.selected = "selected";
      }
      return branch;
    });
  } else {
    branches = branches.map((branch) => {
      if (branch._id == null) {
        branch.selected = "selected";
      }
      return branch;
    });
  }

  if (branchID) {
    branch = await branchService.getBranchById(branchID);
  } else {
    branch = {
      //hardcode all @TODO find a better way to do this ??
      _id: null,
      branchname: "الكل",
      selected: "selected",
    };
  }

  if (req.query.fromDate) {
    fromDate = req.query.fromDate;
  }

  if (req.query.toDate) {
    toDate = req.query.toDate;
  }

  if (req.query.taxStatus) {
    taxStatus = req.query.taxStatus;
    taxStatuses = taxStatuses.map((status) => {
      if (status.value === taxStatus) {
        status.selected = "selected";
      } else {
        delete status.selected;
      }
      return status;
    });
  }

  let { invoices, total, taxTotal, invoicesTotal } =
    await invoiceService.getReport(branchID, fromDate, toDate, taxStatus);
  total = (total ?? 0).toFixed(2);
  taxTotal = (taxTotal ?? 0).toFixed(2);
  invoicesTotal = (invoicesTotal ?? 0).toFixed(2);
  res.render("invoice/invoiceReport.hbs", {
    branches,
    invoices,
    total,
    taxTotal,
    invoicesTotal,
    branchID,
    statuses: taxStatuses,
    branch,
    branchedRole: req.user.branchedRole,
    fromDate,
    toDate,
  });
};

exports.excelReport = async (req, response) => {
  let branchID = null;
  let branch = null;
  let fromDate = null;
  let toDate = null;
  let taxStatus = 0;
  let branches = await branchService.getAllBranches(req.user.companyID);
  branches.unshift({
    //hardcode all @TODO find a better way to do this ??
    _id: null,
    branchname: "الكل",
    companyID: "61fb9a9055372857247e7bdc",
  });

  if (req.user.branchedRole) {
    branchID = req.user.branchID;
  } else if (req.query.branchID) {
    branchID = req.query.branchID;
    branches = branches.map((branch) => {
      if (branch._id == branchID) {
        branch.selected = "selected";
      }
      return branch;
    });
  } else {
    branches = branches.map((branch) => {
      if (branch._id == null) {
        branch.selected = "selected";
      }
      return branch;
    });
  }

  if (branchID) {
    branch = await branchService.getBranchById(branchID);
  } else {
    branch = {
      //hardcode all @TODO find a better way to do this ??
      _id: null,
      branchname: "الكل",
      selected: "selected",
    };
  }

  if (req.query.fromDate) {
    fromDate = req.query.fromDate;
  }

  if (req.query.toDate) {
    toDate = req.query.toDate;
  }

  if (req.query.taxStatus) {
    taxStatus = req.query.taxStatus;
    taxStatuses = taxStatuses.map((status) => {
      if (status.value === taxStatus) {
        status.selected = "selected";
      } else {
        delete status.selected;
      }
      return status;
    });
  }

  const { invoices, total, taxTotal, invoicesTotal } =
    await invoiceService.getReport(branchID, fromDate, toDate, taxStatus);

  const workbook = new excelJS.Workbook();
  const worksheet = workbook.addWorksheet("Invoices");

  worksheet.columns = [
    { header: "تاريخ الفاتورة", key: "date", width: 10 },
    { header: "رقم الفاتورة", key: "invoiceNumber", width: 10 },
    { header: "قبل الضريبة", key: "amount", width: 10 },
    { header: "قيمة الفاتورة", key: "totalAmount", width: 10 },
    { header: "قيمة الضريبة", key: "taxValue", width: 10 },
    { header: "الرقم الضريبي للمورد", key: "supplierTaxNumber", width: 10 },
    { header: "اسم المورد", key: "supplierName", width: 10 },
  ];

  worksheet.views = [{ rightToLeft: true }];
  // Making first line in excel bold
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
  });

  if (invoices) {
    for (const day of invoices) {
      for (const invoice of day) {
        if (!invoice.date) {
          continue;
        }
        worksheet.addRow({
          date: invoice.date,
          taxValue: invoice.taxValue,
          supplierTaxNumber: invoice.supplierTaxNumber,
          amount: invoice.amount,
          totalAmount: invoice.amount + invoice.taxValue,
          invoiceNumber: invoice.invoiceNumber,
          supplierName: invoice.supplierName,
        });
      }
    }

    for (let i = 0; i < 3; i++) {
      worksheet.addRow(); //adding three empty lines to the sheet
    }

    worksheet.addRow({
      date: "إجمالي الفواتير",
      invoiceNumber: invoicesTotal,
      amount: "إجمالي الضرائب",
      totalAmount: taxTotal,
      taxValue: null,
      supplierTaxNumber: "إجمالي المصروفات",
      supplierName: total,
    });

    response.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    response.setHeader(
      "Content-Disposition",
      "attachment; filename=" + "data.xlsx"
    );

    return workbook.xlsx.write(response).then(function () {
      response.status(200).end();
    });
  }
};
