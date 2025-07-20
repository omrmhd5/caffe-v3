require("../../db/mongoose");
const Financial = require("../../models/financial");
const Rent = require("../../models/rentBranch");
const DailyIncome = require("../../models/dailyIncome");
const branchService = require("../branch/service");
const partnerService = require("../partner/service");
const taxValueService = require("../taxValue/service");

const { NotFoundException } = require("../common/errors/exceptions");
const Salary = require("../../models/salary");
const Invoice = require("../../models/invoice");
require("../common/date");

exports.report = async (date, user) => {
  let results = [];
  if (!date) return results;

  let branches = await branchService.getAllBranches(user.companyID);

  let totals = await this.calculateTotalsByDate(date, branches);

  let financials = await Financial.find({ date, branchID: { $in: branches } })
    .populate("branchID")
    .populate("accounter")
    .lean();

  return { financials, totals };
};

exports.getAllFinancials = async (date, branchID, user) => {
  let find = {};

  if (date) {
    find.date = date;
  } else {
    find.date = new Date().toDateInputValue();
  }

  if (branchID) {
    find.branchID = branchID;
  } else {
    let branches = await branchService.getAllBranches(user.companyID);
    find.branchID = {
      $in: branches,
    };
  }

  return Financial.find(find).populate("branchID").populate("accounter").lean();
};

exports.getFinanceById = async (id) => {
  const item = await Financial.findById(id).populate("branchID");
  if (!item) {
    throw new NotFoundException("الصنف غير موجود");
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
  let netIncome = (
    parseFloat(financial.income) -
    parseFloat(financial.rent) -
    parseFloat(financial.expenses) -
    parseFloat(financial.bankRatio) -
    parseFloat(financial.salaries) -
    parseFloat(financial.saudizationSalary) -
    parseFloat(financial.bills) -
    parseFloat(financial.bills1) -
    parseFloat(financial.bills2)
  ).toFixed(2);

  financial.netIncome = netIncome;

  await Financial.findOneAndUpdate({ date, branchID }, financial, {
    upsert: true,
  });

  return;
};

exports.updateComment = async (date, branchID, comment, rentComment) => {
  await Financial.findOneAndUpdate(
    { date, branchID },
    {
      comment,
    },
    { upsert: true }
  );

  await Rent.findOneAndUpdate(
    { branchID },
    {
      rentDate: rentComment,
    },
    { upsert: true }
  );

  return;
};

exports.updateRentNote = async (branchID, note) => {
  await Rent.findOneAndUpdate(
    { branchID },
    {
      rentDate: note,
    },
    { upsert: true }
  );

  return;
};

exports.getFinanceByBranchId = async (branchID, date) => {
  const financial = await Financial.findOne({
    branchID,
    date: new Date(date).toDateInputValue(),
  }).populate("branchID");

  let branch = await branchService.getBranchById(branchID);
  let previousRent;

  if (!financial) {
    const previousMonthFinancial = await Financial.findOne({
      branchID,
      rent: {
        $ne: 0,
      },
    }).sort({
      date: -1,
    });

    previousRent = previousMonthFinancial ? previousMonthFinancial.rent : 0;
    if (financial && !financial.rent) {
      financial.rent = previousRent;
    }
  }

  if (!financial) {
    return {
      branchID: { branchname: branch.branchname },
      saudizationSalary: 0,
      income: 0,
      rent: previousRent,
      expenses: 0,
      bankRatio: 0,
      salaries: 0,
      bills: 0,
      bills1: 0,
      bills2: 0,
      comment: "",
      netIncome: 0,
    };
  }

  return financial;
};

exports.calculateTotalsByDate = async (date, branches) => {
  let totals = await Financial.aggregate([
    {
      $match: {
        date: new Date(date),
        branchID: {
          $in: branches.map((b) => b._id),
        },
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
  let branches = await branchService.getAllBranches(user.companyID);
  let data = [];
  let totalBankRatio = 0;
  let totalRent = 0;

  for (let branch of branches) {
    let financial = await this.getFinanceByBranchId(branch._id, date);
    financial.branchname = branch.branchname;
    financial.branchID = branch._id;

    let rent = await Rent.findOne({ branchID: branch._id });
    if (rent) {
      financial.rentComment = rent.rentDate;
    }

    const taxValue = await taxValueService.getTaxValue(
      branch._id,
      new Date(date)
    );

    financial.bankRatio = taxValue ? taxValue.taxRatioTotal : 0;
    totalBankRatio += financial.bankRatio;

    data.push(financial);
  }

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
          $in: branches.map((b) => b._id),
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

    let salaries = await Salary.aggregate([
      { $match: { date: new Date(date), branchID: branch._id } },
      {
        $group: {
          _id: null,
          totalSalaries: { $sum: "$netSalary" },
        },
      },
    ]);

    let financial = await Financial.findOne({
      branchID,
      date,
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
          date,
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
      await Financial.create({
        branchID,
        date: new Date(date),
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
  } catch (error) {
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
    console.log('something went wrong while executing updateSalariesAndNetIncome ');
    console.log('error', error);
    console.log('branchID', branchID);
    console.log('date', date);
    console.log('userID', userID);
    console.log('#####################################');
  }
};

exports.updateIncomeAndNetIncome = async (branchID, date, userID) => {
  try {
    let branch = await branchService.getBranchById(branchID);
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
      date: new Date(date).toDateInputValue(),
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
          date: new Date(date).toDateInputValue(),
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
      await Financial.create({
        branchID,
        date: new Date(date).toDateInputValue(),
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
  } catch (error) {
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
    console.log('something went wrong while executing updateIncomeAndNetIncome');
    console.log('error', error);
    console.log('branchID', branchID);
    console.log('date', date);
    console.log('userID', userID);
    console.log('#####################################');
  }
};

exports.updateExpenses = async (branchID, date, userID = null) => {
  try {
    let branch = await branchService.getBranchById(branchID);

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
          month: new Date(date).getMonth() + 1,
          year: new Date(date).getFullYear(),
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
      date: new Date(date).toDateInputValue(),
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
          date: new Date(date).toDateInputValue(),
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
      await Financial.create({
        branchID,
        date: new Date(date).toDateInputValue(),
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

  } catch (error) {
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
    console.log('something went wrong while executing updateExpenses');
    console.log('error', error);
    console.log('branchID', branchID);
    console.log('date', date);
    console.log('userID', userID);
    console.log('#####################################');
  }
};
