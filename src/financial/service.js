require("../../db/mongoose");
const Financial = require("../../models/financial");

const DailyIncome = require("../../models/dailyIncome");
const branchService = require("../branch/service");
const partnerService = require("../partner/service");
const taxValueService = require("../taxValue/service");

const { NotFoundException } = require("../common/errors/exceptions");
const Salary = require("../../models/salary");
const Invoice = require("../../models/invoice");
const { toMonthStartDate } = require("../common/date");

// Simple in-memory cache for branch data
const branchCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper to get cached branch data
async function getCachedBranch(branchId) {
  const cached = branchCache.get(branchId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const branch = await branchService.getBranchById(branchId);
  branchCache.set(branchId, {
    data: branch,
    timestamp: Date.now(),
  });

  return branch;
}

// Helper to get rent for a branch for a specific date
async function getRentForMonth(branch, date) {
  if (!branch.rentHistory || branch.rentHistory.length === 0) return 0;
  const d = new Date(date);
  // Find the most recent rent entry before or at the given date
  let best = null;
  for (const entry of branch.rentHistory) {
    if (entry.fromDate <= d && (!best || entry.fromDate > best.fromDate)) {
      best = entry;
    }
  }
  return best ? best.value : 0;
}

exports.report = async (date, user) => {
  let results = [];
  if (!date) return results;

  let branches = await branchService.getAllBranches(user.companyID, date);

  let totals = await this.calculateTotalsByDate(date, branches);

  let financials = await Financial.find({
    date,
    branchID: { $in: branches.map((b) => b._id) },
  })
    .populate("branchID")
    .populate("accounter")
    .lean();

  // Update rent in financials to use rentHistory
  for (let f of financials) {
    if (f.branchID && f.branchID.rentHistory) {
      f.rent = await getRentForMonth(f.branchID, date);
    }

    // Set rent comment directly from comment field
    f.rentComment = f.comment || "";
  }

  return { financials, totals };
};

exports.getAllFinancials = async (date, branchID, user) => {
  let find = {};
  let branches;
  if (date) {
    find.date = date;
  } else {
    find.date = new Date().toDateInputValue();
  }

  if (branchID) {
    find.branchID = branchID;
    branches = [await branchService.getBranchById(branchID)];
  } else {
    branches = await branchService.getAllBranches(user.companyID, find.date);
    find.branchID = {
      $in: branches.map((b) => b._id),
    };
  }

  let financials = await Financial.find(find)
    .populate("branchID")
    .populate("accounter")
    .lean();
  // Update rent in financials to use rentHistory
  for (let f of financials) {
    if (f.branchID && f.branchID.rentHistory) {
      f.rent = await getRentForMonth(f.branchID, find.date);
    }
  }
  return financials;
};

exports.getFinanceById = async (id) => {
  const item = await Financial.findById(id).populate("branchID");
  if (!item) {
    throw new NotFoundException("الصنف غير موجود");
  }
  // Update rent to use rentHistory
  if (item.branchID && item.branchID.rentHistory) {
    item.rent = await getRentForMonth(item.branchID, item.date);
  }
  return item;
};

exports.deleteFinance = async (id) => {
  const item = await Financial.findById(id);
  if (!item) {
    throw new NotFoundException("الصنف غير موجود");
  }

  await Financial.findByIdAndDelete(id);
  return;
};

exports.updateFinance = async (date, branchID, financial) => {
  const normalizedDate = toMonthStartDate(date);
  // Prevent update if branch is not editable for this date
  const editable = await branchService.isBranchEditable(branchID, date);
  if (!editable) {
    throw new NotFoundException("لا يمكن تعديل فرع مخفي أو بعد تاريخ الإخفاء");
  }
  // Use rent from rentHistory if not explicitly set
  const branch = await branchService.getBranchById(branchID);
  if (
    branch &&
    branch.rentHistory &&
    (!financial.rent || financial.rent === 0)
  ) {
    financial.rent = await getRentForMonth(branch, date);
  }

  // Always recalculate salaries from Salary collection for this branch/month
  const month = new Date(date).getMonth() + 1;
  const year = new Date(date).getFullYear();
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
  const salariesForMonth = await Salary.find({
    branchID: branch._id,
    date: {
      $gte: startOfMonth,
      $lte: endOfMonth,
    },
  }).lean();
  financial.salaries = salariesForMonth.reduce(
    (sum, salary) => sum + salary.netSalary,
    0
  );

  let netIncome = (
    parseFloat(financial.income) -
    parseFloat(financial.rent) -
    parseFloat(financial.expenses) -
    parseFloat(financial.salaries) -
    parseFloat(financial.saudizationSalary) -
    parseFloat(financial.bills) -
    parseFloat(financial.bills1) -
    parseFloat(financial.bills2)
  ).toFixed(2);

  financial.netIncome = netIncome;

  // Only upsert if at least one main field is non-zero
  const hasData = [
    financial.income,
    financial.rent,
    financial.expenses,
    financial.bankRatio,
    financial.salaries,
    financial.saudizationSalary,
    financial.bills,
    financial.bills1,
    financial.bills2,
  ].some((v) => parseFloat(v) && parseFloat(v) !== 0);

  if (hasData) {
    await Financial.findOneAndUpdate(
      {
        date: normalizedDate,
        branchID,
      },
      financial,
      { upsert: true }
    );
  }

  return;
};

exports.updateComment = async (date, branchID, comment, rentComment) => {
  const normalizedDate = toMonthStartDate(date);

  await Financial.findOneAndUpdate(
    { date: normalizedDate, branchID },
    {
      comment: comment || "",
    },
    { upsert: true }
  );

  return;
};

exports.updateRentNote = async (branchID, note, date) => {
  const normalizedDate = toMonthStartDate(date);

  await Financial.findOneAndUpdate(
    { branchID, date: normalizedDate },
    { comment: note || "" },
    { upsert: true }
  );

  return;
};

exports.getFinanceByBranchId = async (branchID, date) => {
  const normalizedDate = toMonthStartDate(date);

  const financial = await Financial.findOne({
    branchID,
    date: normalizedDate,
  }).populate("branchID");

  let branch = await getCachedBranch(branchID);
  let rent = await getRentForMonth(branch, date);

  // Auto-calculate salaries for the branch/month
  const month = new Date(date).getMonth() + 1;
  const year = new Date(date).getFullYear();

  // Use a simpler approach - direct query with date range
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  const salariesForMonth = await Salary.find({
    branchID: branch._id,
    date: {
      $gte: startOfMonth,
      $lte: endOfMonth,
    },
  }).lean();

  const calculatedSalaries = salariesForMonth.reduce(
    (sum, salary) => sum + salary.netSalary,
    0
  );

  if (!financial) {
    return {
      branchID: { branchname: branch.branchname },
      saudizationSalary: 0,
      income: 0,
      rent: rent,
      expenses: 0,
      bankRatio: 0,
      salaries: calculatedSalaries, // Use calculated salaries instead of 0
      bills: 0,
      bills1: 0,
      bills2: 0,
      comment: "",
      netIncome: 0,
    };
  }
  // Update rent to use rentHistory
  if (branch && branch.rentHistory) {
    financial.rent = rent;
  }
  // Always use calculated salaries instead of stored value
  financial.salaries = calculatedSalaries;

  return financial;
};

exports.calculateTotalsByDate = async (date, branches) => {
  let totals = await Financial.aggregate([
    {
      $project: {
        income: 1,
        rent: 1,
        salaries: 1,
        expenses: 1,
        bankRatio: 1,
        bills: 1,
        bills1: 1,
        bills2: 1,
        saudizationSalary: 1,
        netIncome: 1,
        branchID: 1,
        month: { $month: "$date" },
        year: { $year: "$date" },
      },
    },
    {
      $match: {
        branchID: { $in: branches.map((b) => b._id) },
        month: new Date(date).getMonth() + 1,
        year: new Date(date).getFullYear(),
      },
    },
    {
      $group: {
        _id: null,
        totalIncome: { $sum: "$income" },
        totalRent: { $sum: "$rent" },
        totalSalaries: { $sum: "$salaries" },
        totalExpenses: { $sum: "$expenses" },
        totalBankRatio: { $sum: "$bankRatio" },
        totalBills: { $sum: "$bills" },
        totalBills1: { $sum: "$bills1" },
        totalBills2: { $sum: "$bills2" },
        totalSaudizationSalary: { $sum: "$saudizationSalary" },
        totalNetIncome: { $sum: "$netIncome" },
      },
    },
  ]);

  if (totals[0]) {
    totals[0].totalIncome = totals[0].totalIncome.toFixed(2);
    totals[0].totalRent = totals[0].totalRent.toFixed(2);
    totals[0].totalSalaries = totals[0].totalSalaries.toFixed(2);
    totals[0].totalExpenses = totals[0].totalExpenses.toFixed(2);
    totals[0].totalBankRatio = totals[0].totalBankRatio.toFixed(2);
    totals[0].totalBills = totals[0].totalBills.toFixed(2);
    totals[0].totalBills1 = totals[0].totalBills1.toFixed(2);
    totals[0].totalBills2 = totals[0].totalBills2.toFixed(2);
    totals[0].totalNetIncome = totals[0].totalNetIncome.toFixed(2);
  }

  return totals[0];
};

exports.showAdd = async (date, user) => {
  let branches = await branchService.getAllBranches(user.companyID, date);
  let data = [];
  let totalBankRatio = 0;
  let totalRent = 0;

  // Batch all the queries for better performance
  const branchIds = branches.map((b) => b._id);

  // Get all financial data in parallel
  const financialPromises = branches.map((branch) =>
    this.getFinanceByBranchId(branch._id, date)
  );

  // Get all tax values in parallel
  const taxValuePromises = branches.map((branch) =>
    taxValueService.getTaxValue(branch._id, new Date(date))
  );

  // Execute all queries in parallel
  const [financialResults, taxValueResults] = await Promise.all([
    Promise.all(financialPromises),
    Promise.all(taxValuePromises),
  ]);

  // Process results
  for (let i = 0; i < branches.length; i++) {
    let financial = financialResults[i];
    let taxValue = taxValueResults[i];
    let branch = branches[i];

    financial.branchname = branch.branchname;
    financial.branchID = branch._id;

    // Set rent comment directly from comment field
    financial.rentComment = financial.comment || "";

    financial.bankRatio = taxValue ? taxValue.taxRatioTotal : 0;
    totalBankRatio += financial.bankRatio;

    data.push(financial);
  }

  // Get incomes data
  const incomes = await DailyIncome.aggregate([
    {
      $project: {
        cash: 1,
        visa: 1,
        mada: 1,
        coffeeShop: 1,
        addedIncome: 1,
        bankTransfer: 1,
        month: { $month: "$date" },
        year: { $year: "$date" },
        branchID: 1,
        date: 1,
      },
    },
    {
      $match: {
        month: new Date(date).getMonth() + 1,
        year: new Date(date).getFullYear(),
        branchID: {
          $in: branchIds,
        },
      },
    },
    {
      $group: {
        _id: null,
        cash: { $sum: "$cash" },
        visa: { $sum: "$visa" },
        mada: { $sum: "$mada" },
        coffeeShop: { $sum: "$coffeeShop" },
        addedIncome: { $sum: "$addedIncome" },
        bankTransfer: { $sum: "$bankTransfer" },
      },
    },
  ]);

  let totals = await this.calculateTotalsByDate(
    new Date(date).toDateInputValue(),
    branches
  );

  let partner = await partnerService.getByDate(date, user.companyID);

  for (let d of data) {
    totalRent += d.rent;
  }

  if (totals) {
    totals.totalRent = totalRent;
    totals.totalBankRatio = totalBankRatio;
  } else {
    totals = {
      totalRent,
      totalBankRatio,
    };
  }

  return { data, incomes, totals, partner };
};

exports.updateSalariesAndNetIncome = async (branchID, date, userID) => {
  try {
    let branch = await branchService.getBranchById(branchID);
    const normalizedDate = toMonthStartDate(date);

    let salaries = await Salary.aggregate([
      { $match: { date: normalizedDate, branchID: branch._id } },
      {
        $group: {
          _id: null,
          totalSalaries: { $sum: "$netSalary" },
        },
      },
    ]);

    let financial = await Financial.findOne({
      branchID,
      date: normalizedDate,
    });

    if (financial) {
      let netIncome = financial.netIncome;
      let oldSalaries = financial.salaries;

      netIncome =
        parseFloat(netIncome) +
        parseFloat(oldSalaries) -
        parseFloat(salaries[0].totalSalaries);

      await Financial.findOneAndUpdate(
        {
          branchID,
          date: normalizedDate,
        },
        {
          netIncome,
          salaries: salaries[0].totalSalaries,
        },
        {
          upsert: true,
        }
      );
    } else {
      // Only create if salaries is non-zero
      if (salaries[0] && salaries[0].totalSalaries !== 0) {
        await Financial.create({
          branchID,
          date: normalizedDate,
          expenses: 0,
          income: 0,
          netIncome: -salaries[0].totalSalaries,
          salaries: salaries[0].totalSalaries,
          rent: 0,
          bankRatio: 0,
          saudizationSalary: 0,
          bills: 0,
          bills1: 0,
          bills2: 0,
          comment: 0,
          partners: 0,
          accounter: userID,
        });
      }
    }
  } catch (error) {
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    console.log(
      "something went wrong while executing updateSalariesAndNetIncome "
    );
    console.log("error", error);
    console.log("branchID", branchID);
    console.log("date", date);
    console.log("userID", userID);
    console.log("#####################################");
  }
};

exports.updateIncomeAndNetIncome = async (branchID, date, userID) => {
  try {
    let branch = await branchService.getBranchById(branchID);
    const normalizedDate = toMonthStartDate(date);
    let incomes = await DailyIncome.aggregate([
      {
        $project: {
          cash: 1,
          visa: 1,
          mada: 1,
          coffeeShop: 1,
          addedIncome: 1,
          bankTransfer: 1,
          dailyTotal: 1,
          arbitrage: 1,
          day: { $dayOfMonth: "$date" },
          month: { $month: "$date" },
          year: { $year: "$date" },
          branchID: 1,
          date: 1,
        },
      },
      {
        $match: {
          branchID: branch._id,
          month: new Date(date).getMonth() + 1,
          year: new Date(date).getFullYear(),
        },
      },
      {
        $group: {
          _id: null,
          dailyTotal: { $sum: "$dailyTotal" },
        },
      },
    ]);

    let financial = await Financial.findOne({
      branchID,
      date: normalizedDate,
    });

    if (financial) {
      let netIncome = financial.netIncome;
      let oldIncome = financial.income;

      netIncome =
        parseFloat(netIncome) -
        parseFloat(oldIncome) +
        parseFloat(incomes[0].dailyTotal);

      await Financial.findOneAndUpdate(
        {
          branchID,
          date: normalizedDate,
        },
        {
          netIncome,
          income: incomes[0].dailyTotal,
        },
        {
          upsert: true,
        }
      );
    } else {
      // Only create if income is non-zero
      if (incomes[0] && incomes[0].dailyTotal !== 0) {
        await Financial.create({
          branchID,
          date: normalizedDate,
          expenses: 0,
          income: incomes[0].dailyTotal,
          salaries: 0,
          rent: 0,
          bankRatio: 0,
          saudizationSalary: 0,
          bills: 0,
          bills1: 0,
          bills2: 0,
          netIncome: incomes[0].dailyTotal,
          comment: 0,
          partners: 0,
          accounter: userID,
        });
      }
    }
  } catch (error) {
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    console.log(
      "something went wrong while executing updateIncomeAndNetIncome"
    );
    console.log("error", error);
    console.log("branchID", branchID);
    console.log("date", date);
    console.log("userID", userID);
    console.log("#####################################");
  }
};

exports.updateExpenses = async (branchID, date, userID = null) => {
  try {
    let branch = await branchService.getBranchById(branchID);
    const normalizedDate = toMonthStartDate(date);

    let expenses = await Invoice.aggregate([
      {
        $project: {
          totalAmount: 1,
          day: { $dayOfMonth: "$date" },
          month: { $month: "$date" },
          year: { $year: "$date" },
          branchID: 1,
          date: 1,
        },
      },
      {
        $match: {
          branchID: branch._id,
          month: normalizedDate.getMonth() + 1,
          year: normalizedDate.getFullYear(),
        },
      },
      {
        $group: {
          _id: null,
          amountTotal: { $sum: "$totalAmount" },
        },
      },
    ]);

    let financial = await Financial.findOne({
      branchID,
      date: normalizedDate,
    });

    if (financial) {
      let netIncome = financial.netIncome;
      let oldExpenses = financial.expenses;

      netIncome =
        parseFloat(netIncome) +
        parseFloat(oldExpenses) -
        (expenses[0] ? parseFloat(expenses[0].amountTotal) : 0);

      await Financial.findOneAndUpdate(
        {
          branchID,
          date: normalizedDate,
        },
        {
          netIncome,
          expenses: expenses[0] ? expenses[0].amountTotal : 0,
        },
        {
          upsert: true,
        }
      );
    } else {
      // Only create if expenses is non-zero
      if (expenses[0] && expenses[0].amountTotal !== 0) {
        await Financial.create({
          branchID,
          date: normalizedDate,
          expenses: expenses[0] ? expenses[0].amountTotal : 0,
          income: 0,
          salaries: 0,
          rent: 0,
          bankRatio: 0,
          saudizationSalary: 0,
          bills: 0,
          bills1: 0,
          bills2: 0,
          netIncome: -expenses[0].amountTotal,
          comment: 0,
          partners: 0,
          accounter: userID,
        });
      }
    }
  } catch (error) {
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    console.log("something went wrong while executing updateExpenses");
    console.log("error", error);
    console.log("branchID", branchID);
    console.log("date", date);
    console.log("userID", userID);
    console.log("#####################################");
  }
};

exports.updateTaxValuesAndNetIncome = async (branchID, date, userID) => {
  try {
    let branch = await branchService.getBranchById(branchID);
    const normalizedDate = toMonthStartDate(date);

    // Get the latest tax value for this branch and date
    const taxValue = await taxValueService.getTaxValue(branchID, date);
    const taxRatioTotal = taxValue ? taxValue.taxRatioTotal : 0;

    let financial = await Financial.findOne({
      branchID,
      date: normalizedDate,
    });

    if (financial) {
      // Do not adjust netIncome by bankRatio/taxRatioTotal anymore
      await Financial.findOneAndUpdate(
        {
          branchID,
          date: normalizedDate,
        },
        {
          bankRatio: taxRatioTotal,
        },
        {
          upsert: true,
        }
      );
    } else {
      // Only create if tax ratio is non-zero
      if (taxRatioTotal !== 0) {
        await Financial.create({
          branchID,
          date: normalizedDate,
          expenses: 0,
          income: 0,
          salaries: 0,
          rent: 0,
          bankRatio: taxRatioTotal,
          saudizationSalary: 0,
          bills: 0,
          bills1: 0,
          bills2: 0,
          netIncome: 0, // Tax ratio no longer reduces net income
          comment: 0,
          partners: 0,
          accounter: userID,
        });
      }
    }
  } catch (error) {
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    console.log(
      "something went wrong while executing updateTaxValuesAndNetIncome"
    );
    console.log("error", error);
    console.log("branchID", branchID);
    console.log("date", date);
    console.log("userID", userID);
    console.log("#####################################");
  }
};
