const DailyIncome = require("../../models/dailyIncome");
const branchService = require("../branch/service");
const dateUtility = require("../common/date");

exports.getAll = async (branchID, date, user) => {
  let data = [];
  if (!branchID || !date) {
    return data;
  }

  const branch = await branchService.getBranchById(branchID);

  // Normalize the input date to first day of month
  const normalizedDate = dateUtility.toMonthStartDate(date);
  let start = new Date(normalizedDate);
  let end = new Date(dateUtility.addMonth(start));

  // Single aggregation query to get all daily income records for the month
  const dailyResults = await DailyIncome.aggregate([
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
        createdAt: 1,
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
        month: start.getUTCMonth() + 1,
        year: start.getUTCFullYear(),
      },
    },
  ]);

  // Create a map for quick lookup
  const dailyMap = new Map();
  dailyResults.forEach((result) => {
    const day = result.day;
    dailyMap.set(day, result);
  });

  // Generate data for all days in the month
  let loop = new Date(start);
  while (loop < end) {
    const dayOfMonth = loop.getDate();
    const currentDayDate = new Date(
      Date.UTC(loop.getFullYear(), loop.getMonth(), dayOfMonth)
    );

    const existingRecord = dailyMap.get(dayOfMonth);

    if (!existingRecord) {
      const dailyIncomeDate = new Date(currentDayDate);
      const currentDate = new Date().setHours(0, 0);
      const hours = (currentDate - dailyIncomeDate) / 36e5;
      let disabled = false;

      disabled =
        (hours > 48 || hours < 1) &&
        (user.role === "Invoicer" ||
          user.role === "BranchAccountant" ||
          user.role === "Accountant")
          ? "disabled"
          : "";

      data.push({
        _id: "",
        isSet: false,
        disabled,
        date: currentDayDate,
        mada: 0,
        visa: 0,
        coffeeShop: 0,
        addedIncome: 0,
        bankTransfer: 0,
        branchID: null,
        cash: 0,
        month: 0,
        year: 0,
      });
    } else {
      const dailyIncomeDate = new Date(existingRecord.createdAt);
      const currentDate = new Date();
      const hours = Math.abs(currentDate - dailyIncomeDate) / 36e5;

      existingRecord.isSet = true;
      existingRecord.disabled =
        hours > 6 &&
        (user.role === "Invoicer" ||
          user.role === "BranchAccountant" ||
          user.role === "Accountant")
          ? "disabled"
          : "";

      data.push(existingRecord);
    }

    loop = new Date(loop.setDate(loop.getDate() + 1));
  }

  const totals = await DailyIncome.aggregate([
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
        month: normalizedDate.getUTCMonth() + 1,
        year: normalizedDate.getUTCFullYear(),
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
        arbitrage: { $sum: "$arbitrage" },
        dailyTotal: { $sum: "$dailyTotal" },
      },
    },
  ]);

  return { data, totals };
};

exports.update = async (id, date, note) => {
  await DailyIncome.findByIdAndUpdate(id, {
    date,
    note,
  });
};

exports.addDailyIncome = async (branchID, date, data) => {
  let dailyTotal = 0;
  let arbitrage = 0;

  dailyTotal += data.cash ? parseFloat(data.cash) : 0;
  dailyTotal += data.mada ? parseFloat(data.mada) : 0;
  dailyTotal += data.visa ? parseFloat(data.visa) : 0;
  dailyTotal += data.coffeShop ? parseFloat(data.coffeShop) : 0;
  dailyTotal += data.addedIncome ? parseFloat(data.addedIncome) : 0;
  dailyTotal -= data.bankTransfer ? parseFloat(data.bankTransfer) : 0;

  arbitrage += data.mada ? parseFloat(data.mada) : 0;
  arbitrage += data.visa ? parseFloat(data.visa) : 0;

  dailyTotal = dailyTotal.toFixed(2);
  arbitrage = arbitrage.toFixed(2);

  // Normalize the date to ensure consistent storage
  const normalizedDate = dateUtility.toMonthStartDate(date);
  const dayOfMonth = new Date(date).getDate();
  const targetDate = new Date(
    Date.UTC(
      normalizedDate.getFullYear(),
      normalizedDate.getMonth(),
      dayOfMonth
    )
  );

  // Check if record already exists
  const existingRecord = await DailyIncome.findOne({
    branchID,
    date: targetDate,
  });

  const updateData = {
    date: targetDate,
    branchID: data.branchID,
    cash: data.cash,
    coffeeShop: data.coffeShop,
    addedIncome: data.addedIncome,
    mada: data.mada,
    visa: data.visa,
    bankTransfer: data.bankTransfer,
    dailyTotal,
    arbitrage,
  };

  const result = await DailyIncome.findOneAndUpdate(
    {
      branchID,
      date: targetDate,
    },
    updateData,
    {
      upsert: true,
      new: true,
    }
  );
};
