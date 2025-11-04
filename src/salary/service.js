const Salary = require("../../models/salary");
const Employee = require("../../models/employee");
const financialService = require("../financial/service");
const branchService = require("../branch/service");
const {
  NotFoundException,
  BadRequestException,
} = require("../common/errors/exceptions");
const PAGE_SIZE = require("../common/constants").PAGE_SIZE;
const { toMonthStartDate } = require("../common/date");

exports.getAllSalaries = async (
  branchID = null,
  date = null,
  userRole = ""
) => {
  let results = [];
  let total = 0;
  if (!branchID || !date) {
    return results;
  }

  if (branchID._id) {
    branchID = branchID._id;
  }

  const branch = await branchService.getBranchById(branchID);
  const normalizedDate = toMonthStartDate(date);
  const currentDate = new Date();

  const employees = await Employee.find();
  for (let employee of employees) {
    let salary = await Salary.findOne({
      employeeID: employee._id,
      branchID,
      date: normalizedDate,
    }).lean();

    if (salary) {
      // Check if all salary values are zero (empty/unentered salary)
      // Convert to numbers to handle string values properly
      const isAllZero =
        (parseFloat(salary.salary) || 0) === 0 &&
        (parseFloat(salary.extraWork) || 0) === 0 &&
        (parseFloat(salary.allowance) || 0) === 0 &&
        (parseFloat(salary.amountDecrease) || 0) === 0 &&
        (parseFloat(salary.amountIncrease) || 0) === 0 &&
        (parseFloat(salary.daysDecrease) || 0) === 0 &&
        (parseFloat(salary.daysIncrease) || 0) === 0 &&
        (parseFloat(salary.netSalary) || 0) === 0;

      // Only check time if salary has createdAt (means it exists in DB)
      // and it's not all zeros
      if (!isAllZero && salary.createdAt && userRole != "AccountantManager") {
        // Calculate hours since this specific row was saved to DB
        const salaryDate = new Date(salary.createdAt);
        const hours = Math.abs(currentDate - salaryDate) / 36e5;

        // Disable if 24 hours have passed since this row was saved
        if (hours > 24) {
          salary.disabled = "disabled";
        } else {
          salary.disabled = "";
        }
      } else {
        // Keep enabled if: all zeros, no createdAt (new row), or is AccountantManager
        salary.disabled = "";
      }
    }

    if (
      salary ||
      (employee.branchID.toString() == branchID && employee.status == "working")
    ) {
      if (!salary) {
        salary = {
          branchID,
          employeeID: employee._id,
          extraWork: 0,
          allowance: 0,
          amountDecrease: 0,
          amountIncrease: 0,
          daysDecrease: 0,
          daysIncrease: 0,
          netSalary: 0,
          salary: 0,
        };
      }

      if (
        (employee.branchID.toString() != branchID ||
          employee.status != "working") &&
        userRole != "AccountantManager"
      ) {
        salary.disabled = "disabled";
      }

      // Check if employee's current branch matches the salary record's branch
      const branchMismatch =
        employee.branchID.toString() !== branchID.toString();

      // Determine status indicator color
      let statusIndicator = null;
      if (branchMismatch) {
        statusIndicator = "blue";
      } else if (employee.status === "holiday") {
        statusIndicator = "yellow";
      } else if (employee.status === "notWorking") {
        statusIndicator = "red";
      }

      results.push({
        ...salary,
        ...employee.toObject(),
        branchMismatch: branchMismatch,
        statusIndicator: statusIndicator,
      });
    }
  }

  let salaryTotal = await Salary.aggregate([
    { $match: { date: normalizedDate, branchID: branch._id } },
    {
      $group: {
        _id: null,
        totalSalaries: { $sum: "$netSalary" },
      },
    },
  ]);

  total = salaryTotal.length > 0 ? salaryTotal[0].totalSalaries : 0;

  return { results, total };
};

exports.getAllSalariesWithPagination = (branchID = null, page) => {
  if (!branchID) {
    return Salary.find()
      .populate("branchID")
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE);
  }

  return Salary.find({ branchID })
    .populate("branchID")
    .skip((page - 1) * PAGE_SIZE)
    .lean()
    .limit(PAGE_SIZE);
};

exports.getCount = (branchID = null) => {
  if (!branchID) {
    return Salary.countDocuments();
  }
  return Salary.countDocuments({ branchID });
};

exports.getSalaryById = async (id) => {
  const salary = await Salary.findById(id).populate("branchID");
  if (!salary) {
    throw new NotFoundException("الراتب غير موجود");
  }

  return salary;
};

exports.deleteSalary = async (id) => {
  await Salary.findByIdAndDelete(id);
  return;
};

exports.createSalary = async (
  branchID,
  employeeID,
  date,
  salary,
  extraWork,
  allowance,
  amountIncrease,
  daysIncrease,
  amountDecrease,
  daysDecrease,
  userID
) => {
  if (!employeeID) {
    throw new BadRequestException("الرجاء اختيار الموظف");
  }

  if (!branchID) {
    throw new BadRequestException("الرجاء اختيار الفرع");
  }

  if (!salary) {
    throw new BadRequestException("الرجاء كتابة الراتب");
  }

  const normalizedDate = toMonthStartDate(date);
  const netSalary =
    salary +
    amountIncrease +
    daysIncrease * (salary / 30) +
    allowance +
    extraWork -
    amountDecrease -
    daysDecrease * (salary / 30);

  const foundedSalary = await Salary.findOne({
    employeeID,
    date: normalizedDate,
  });

  if (foundedSalary) {
    await Salary.findByIdAndUpdate(foundedSalary._id, {
      salary,
      extraWork,
      allowance,
      amountIncrease,
      daysIncrease,
      amountDecrease,
      daysDecrease,
      netSalary: netSalary.toFixed(2),
      branchID,
      accounter: userID,
      date: normalizedDate,
    });
  } else {
    // Always create salary records, even if net salary is zero
    // This allows tracking of employees with zero salaries
    await Salary.create({
      employeeID,
      date: normalizedDate,
      salary,
      extraWork,
      allowance,
      amountIncrease,
      daysIncrease,
      amountDecrease,
      daysDecrease,
      netSalary: netSalary.toFixed(2),
      branchID,
      accounter: userID,
    });
  }

  return;
};

exports.updateSalary = async (
  id,
  branchID,
  salary,
  extraWork,
  allowance,
  amountIncrease,
  daysIncrease,
  amountDecrease,
  daysDecrease,
  netSalary,
  date
) => {
  const { toMonthStartDate } = require("../common/date");
  let result = await Salary.findById(id).populate("branchID").lean();
  if (!result) {
    throw new NotFoundException("الراتب غير موجود");
  }

  let update = {};

  if (branchID) {
    update.branchID = branchID;
  }

  if (salary) {
    update.salary = salary;
  }

  if (extraWork) {
    update.extraWork = extraWork;
  }

  if (allowance) {
    update.allowance = allowance;
  }

  if (daysIncrease) {
    update.daysIncrease = daysIncrease;
  }

  if (amountIncrease) {
    update.amountIncrease = amountIncrease;
  }

  if (amountDecrease) {
    update.amountDecrease = amountDecrease;
  }

  if (daysDecrease) {
    update.daysDecrease = daysDecrease;
  }

  if (netSalary) {
    update.netSalary = netSalary;
  }

  if (date) {
    update.date = toMonthStartDate(date);
  }

  salary = await Salary.findByIdAndUpdate(id, update, {
    new: true,
  }).populate("branchID");

  return salary;
};

exports.updateBulk = async (user, salaries) => {
  // Remove the early return for zero total - we should save all salary records
  // even if they sum to zero, as individual employees might have zero salaries

  let hasValidSalaries = false;
  let branchID = null;
  let date = null;

  for (let salary of salaries) {
    // Check if all salary values are zero - skip these rows
    // Convert to numbers to handle string values properly
    const isAllZero =
      (parseFloat(salary.salary) || 0) === 0 &&
      (parseFloat(salary.extraWork) || 0) === 0 &&
      (parseFloat(salary.allowance) || 0) === 0 &&
      (parseFloat(salary.amountDecrease) || 0) === 0 &&
      (parseFloat(salary.amountIncrease) || 0) === 0 &&
      (parseFloat(salary.daysDecrease) || 0) === 0 &&
      (parseFloat(salary.daysIncrease) || 0) === 0 &&
      (parseFloat(salary.netSalary) || 0) === 0;

    // Skip all-zero rows - don't save them to database
    if (isAllZero) {
      continue;
    }

    // Store branchID and date from first valid salary for financial update
    if (!branchID && salary.branchID) {
      branchID = salary.branchID;
      date = salary.date;
      hasValidSalaries = true;
    }

    const normalizedDate = toMonthStartDate(salary.date);
    await Salary.findOneAndUpdate(
      {
        date: normalizedDate,
        branchID: salary.branchID,
        employeeID: salary.employeeID,
      },
      { ...salary, date: normalizedDate },
      {
        upsert: true,
      }
    );
  }

  // Only update financials if we have at least one valid salary
  if (hasValidSalaries && branchID && date) {
    await financialService.updateSalariesAndNetIncome(
      branchID,
      toMonthStartDate(date),
      user._id
    );
  }

  return;
};
