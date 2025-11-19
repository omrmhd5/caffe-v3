const excelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

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
  let paidFromBranchStatus = 0;
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

  if (req.query.paidFromBranchStatus) {
    paidFromBranchStatus = parseInt(req.query.paidFromBranchStatus);
  }

  if (description) {
    invoices = await invoiceService.getInvoiceByDescription(
      branchID,
      description,
      warrantyStatus,
      page,
      fromDate,
      toDate,
      taxStatus,
      paidFromBranchStatus
    );
  } else {
    invoices = await invoiceService.getAllInvoicesWithPagination(
      branchID,
      fromDate,
      toDate,
      warrantyStatus,
      page,
      taxStatus,
      paidFromBranchStatus
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
    taxStatus,
    paidFromBranchStatus
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
    paidFromBranchStatus,
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
    // Checkbox logic: checked = paid from outside (false), unchecked = paid from branch (true, default)
    let paidFromBranch = !req.body.paidFromBranch; // If checkbox is checked, paidFromBranch is false

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
      invoiceNumber,
      paidFromBranch
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
    // Checkbox logic: checked = paid from outside (false), unchecked = paid from branch (true, default)
    let paidFromBranch = !req.body.paidFromBranch; // If checkbox is checked, paidFromBranch is false

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
      invoiceNumber,
      paidFromBranch
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
  let paidFromBranchStatus = 0;

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

  if (req.query.paidFromBranchStatus) {
    paidFromBranchStatus = parseInt(req.query.paidFromBranchStatus);
  }

  let { invoices, total, taxTotal, invoicesTotal, paidFromOutsideTotal, paidFromOutsideCount } =
    await invoiceService.getReport(branchID, fromDate, toDate, taxStatus, paidFromBranchStatus);
  total = (total ?? 0).toFixed(2);
  taxTotal = (taxTotal ?? 0).toFixed(2);
  invoicesTotal = (invoicesTotal ?? 0).toFixed(2);
  paidFromOutsideTotal = (paidFromOutsideTotal ?? 0).toFixed(2);
  res.render("invoice/invoiceReport.hbs", {
    branches,
    invoices,
    total,
    taxTotal,
    invoicesTotal,
    paidFromOutsideTotal,
    paidFromOutsideCount: paidFromOutsideCount || 0,
    branchID,
    statuses: taxStatuses,
    branch,
    branchedRole: req.user.branchedRole,
    fromDate,
    toDate,
    paidFromBranchStatus,
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

  let paidFromBranchStatus = 0;
  if (req.query.paidFromBranchStatus) {
    paidFromBranchStatus = parseInt(req.query.paidFromBranchStatus);
  }

  const { invoices, total, taxTotal, invoicesTotal } =
    await invoiceService.getReport(branchID, fromDate, toDate, taxStatus, paidFromBranchStatus);

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

exports.pdfExport = async (req, res) => {
  try {
    let branchID = null;
    let branch = null;
    let fromDate = null;
    let toDate = null;
    let taxStatus = 0;
    let warrantyStatus = 0;
    let description = null;

    if (req.user.branchedRole) {
      branchID = req.user.branchID;
    } else {
      branchID = req.query.branchID;
    }

    if (!branchID) {
      return res.status(400).send({ errorMessage: "الرجاء اختيار الفرع" });
    }

    branch = await branchService.getBranchById(branchID);

    if (req.query.fromDate) {
      fromDate = req.query.fromDate;
    }

    if (req.query.toDate) {
      toDate = req.query.toDate;
    }

    if (req.query.warrantyStatus) {
      warrantyStatus = req.query.warrantyStatus;
    }

    if (req.query.taxStatus) {
      taxStatus = req.query.taxStatus;
    }

    if (req.query.description) {
      description = req.query.description;
    }

    // Get all invoices for export
    const invoices = await invoiceService.getAllInvoicesForExport(
      branchID,
      fromDate,
      toDate,
      warrantyStatus,
      taxStatus,
      description
    );

    // Get status labels
    const warrantyStatusLabel =
      warrantyStatuses.find((s) => s.value == warrantyStatus)?.name || "الكل";
    const taxStatusLabel =
      taxStatuses.find((s) => s.value == taxStatus)?.name || "الكل";

    // Create PDF document
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    // Register Arabic font
    const arabicFontPath = path.join(
      __dirname,
      "../../public/assets/css/majalla.ttf"
    );
    let arabicFont = "Helvetica"; // Default fallback

    if (fs.existsSync(arabicFontPath)) {
      try {
        doc.registerFont("Arabic", arabicFontPath);
        arabicFont = "Arabic";
      } catch (error) {
        console.error("Error registering Arabic font:", error);
      }
    }

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");

    // Generate filename: invoice-branch-dateFrom-DateTo
    // All in Arabic except dates (English)
    const branchNameForFile = (branch?.branchname || "غير-محدد").replace(
      /\s+/g,
      "-"
    );
    const fromDateForFile = fromDate || "غير-محدد";
    const toDateForFile = toDate || "غير-محدد";
    const filename = `فواتير-${branchNameForFile}-${fromDateForFile}-${toDateForFile}.pdf`;

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${encodeURIComponent(filename)}`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // Helper function to reverse Arabic word order (last word becomes first)
    const reverseArabicWords = (text) => {
      if (!text) return "";
      return text.split(" ").reverse().join(" ");
    };

    // First page - Summary information (all in Arabic, right-aligned, same line)
    // For RTL text, we need to put value first, then label for proper display
    const pageWidth = doc.page.width;
    const margin = 50;
    let currentY = 50;

    // فواتير فرع: [Branch name] - Reverse word order and put value first
    doc.font(arabicFont).fontSize(20);
    const reversedBranchName = reverseArabicWords(branch?.branchname || "");
    const branchText = `${reversedBranchName} فرع: فواتير`;
    doc.text(branchText, margin, currentY, {
      width: pageWidth - 2 * margin,
      align: "right",
    });
    currentY += 40;

    // من تاريخ: [From date] - Dates don't need reversal
    const fromDateText = `${fromDate || "غير محدد"} تاريخ: من`;
    doc.text(fromDateText, margin, currentY, {
      width: pageWidth - 2 * margin,
      align: "right",
    });
    currentY += 40;

    // الى: [To date] - Dates don't need reversal
    const toDateText = `${toDate || "غير محدد"} الى:`;
    doc.text(toDateText, margin, currentY, {
      width: pageWidth - 2 * margin,
      align: "right",
    });
    currentY += 40;

    // نوع الفواتير: [Tax status] - Reverse word order
    const reversedTaxStatus = reverseArabicWords(taxStatusLabel);
    const taxStatusText = `${reversedTaxStatus} الفواتير: نوع`;
    doc.text(taxStatusText, margin, currentY, {
      width: pageWidth - 2 * margin,
      align: "right",
    });
    currentY += 40;

    // حالة الضمان: [Warranty status] - Reverse word order
    const reversedWarrantyStatus = reverseArabicWords(warrantyStatusLabel);
    const warrantyStatusText = `${reversedWarrantyStatus} الضمان: حالة`;
    doc.text(warrantyStatusText, margin, currentY, {
      width: pageWidth - 2 * margin,
      align: "right",
    });
    currentY += 40;

    // إجمالي الفواتير: [Total invoices count]
    const totalInvoicesText = `${invoices.length} الفواتير: إجمالي`;
    doc.text(totalInvoicesText, margin, currentY, {
      width: pageWidth - 2 * margin,
      align: "right",
    });

    // Helper function to get month and year from date
    const getMonthYear = (date) => {
      if (!date) return null;
      const d = new Date(date);
      return {
        month: d.getMonth(),
        year: d.getFullYear(),
      };
    };

    // Helper function to format month name in Arabic
    const getMonthNameArabic = (monthIndex) => {
      const months = [
        "يناير",
        "فبراير",
        "مارس",
        "أبريل",
        "مايو",
        "يونيو",
        "يوليو",
        "أغسطس",
        "سبتمبر",
        "أكتوبر",
        "نوفمبر",
        "ديسمبر",
      ];
      return months[monthIndex] || "";
    };

    // Add a new page for each invoice
    let previousMonthYear = null;
    for (let i = 0; i < invoices.length; i++) {
      const invoice = invoices[i];
      const invoiceDate = new Date(invoice.date);
      const currentMonthYear = getMonthYear(invoiceDate);

      // Check if month changed (and it's not the first invoice)
      if (previousMonthYear !== null) {
        if (
          currentMonthYear.month !== previousMonthYear.month ||
          currentMonthYear.year !== previousMonthYear.year
        ) {
          // Month changed - add page break with message
          doc.addPage();

          // Format the message: "the upcoming invoices are for the new month: [month] till [date]"
          const monthNameArabic = getMonthNameArabic(currentMonthYear.month);
          const year = currentMonthYear.year;
          const monthDateText = `${monthNameArabic} ${year}`;
          const tillDateText = toDate || "غير محدد";

          // Construct the message for proper RTL display in PDFKit
          // For RTL, we write in visual order (left to right): [date] حتى [month] الجديد الشهر للهي القادمة الفواتير
          // This displays correctly as: "الفواتير القادمة هي للشهر الجديد [month] حتى [date]"
          // Note: Don't reverse monthDateText as it contains numbers
          const reversedArabicPart = reverseArabicWords(
            "الفواتير القادمة هي للشهر الجديد"
          );
          const messageText = `${tillDateText} حتى ${monthDateText} ${reversedArabicPart}`;

          // Center the text vertically, but align right for proper RTL display
          const pageHeight = doc.page.height;
          const centerY = pageHeight / 2;

          doc
            .font(arabicFont)
            .fontSize(24)
            .text(messageText, margin, centerY - 50, {
              width: pageWidth - 2 * margin,
              align: "right",
            });
        }
      }

      // Add page for invoice
      doc.addPage();

      // Invoice Description (in Arabic, right-aligned)
      // Reverse word order and put description first, then label
      const invoicePageWidth = doc.page.width;
      const invoiceMargin = 50;

      if (invoice.description) {
        // Reverse the description word order (last word becomes first)
        const reversedDescription = reverseArabicWords(invoice.description);
        const descriptionText = `${reversedDescription} الفاتورة: وصف`;
        doc
          .font(arabicFont)
          .fontSize(18)
          .text(descriptionText, invoiceMargin, 50, {
            width: invoicePageWidth - 2 * invoiceMargin,
            align: "right",
          });
      } else {
        doc
          .font(arabicFont)
          .fontSize(18)
          .text("لا يوجد وصف الفاتورة: وصف", invoiceMargin, 50, {
            width: invoicePageWidth - 2 * invoiceMargin,
            align: "right",
          });
      }

      // Invoice photo
      if (invoice.image) {
        const imagePath = path.join(__dirname, "../../public", invoice.image);
        try {
          if (fs.existsSync(imagePath)) {
            // Get image dimensions to fit on page
            const imageWidth = 500;
            const imageHeight = 600;
            const yPosition = 150;

            doc.image(imagePath, 50, yPosition, {
              fit: [imageWidth, imageHeight],
              align: "center",
            });
          }
        } catch (error) {
          console.error("Error loading image:", error);
        }
      }

      // Update previous month for next iteration
      previousMonthYear = currentMonthYear;
    }

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error("PDF Export Error:", error);
    res.status(500).send({ errorMessage: "خطأ في تصدير PDF" });
  }
};
