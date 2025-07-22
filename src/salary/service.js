const Salary = require("../../models/salary");
const Employee = require("../../models/employee");
const financialService = require("../financial/service");
const branchService = require("../branch/service");
const {
  NotFoundException,
  BadRequestException,
} = require("../common/errors/exceptions");
const PAGE_SIZE = require("../common/constants").PAGE_SIZE;

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

  const currentDate = new Date();

  const employees = await Employee.find();
  for (let employee of employees) {
    let salary = await Salary.findOne({
      employeeID: employee._id,
      branchID,
      date,
    }).lean();

    if (salary) {
      const salaryDate = new Date(salary.createdAt);
      const hours = parseInt(Math.abs(currentDate - salaryDate) / 36e5);

      salary.disabled =
        hours > 48 && userRole != "AccountantManager" ? "disabled" : "";
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
          amountDecrease: 0,
          amountIncrease: 0,
          daysDecrease: 0,
          daysIncrease: 0,
          netSalary: 0,
          salary: 0,
        };
      }

      if (
        employee.branchID.toString() != branchID ||
        employee.status != "working"
      ) {
        salary.disabled = "disabled";
      }

      results.push({
        ...salary,
        ...employee.toObject(),
      });
    }
  }

  let salaryTotal = await Salary.aggregate([
    { $match: { date: new Date(date), branchID: branch._id } },
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
  const salary = await Salary.findById(id);
  if (!salary) {
    throw new NotFoundException("الراتب غير موجود");
  }

  await Salary.findByIdAndDelete(id);
  return;
};

exports.createSalary = async (
  branchID,
  employeeID,
  date,
  salary,
  extraWork,
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

  const netSalary =
    salary +
    amountIncrease +
    daysIncrease * (salary / 30) -
    amountDecrease -
    daysDecrease * (salary / 30) -
    extraWork;

  const foundedSalary = await Salary.findOne({
    employeeID,
    date,
  });

  if (foundedSalary) {
    await Salary.findByIdAndUpdate(foundedSalary._id, {
      salary,
      extraWork,
      amountIncrease,
      daysIncrease,
      amountDecrease,
      daysDecrease,
      netSalary: netSalary.toFixed(2),
      branchID,
      accounter: userID,
    });
  } else {
    if (netSalary !== 0) {
      await Salary.create({
        employeeID,
        date,
        salary,
        extraWork,
        amountIncrease,
        daysIncrease,
        amountDecrease,
        daysDecrease,
        netSalary: netSalary.toFixed(2),
        branchID,
        accounter: userID,
      });
    }
  }

  return;
};

exports.updateSalary = async (
  id,
  branchID,
  salary,
  extraWork,
  amountIncrease,
  daysIncrease,
  amountDecrease,
  daysDecrease,
  netSalary
) => {
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

  salary = await Salary.findByIdAndUpdate(id, update, {
    new: true,
  }).populate("branchID");

  return salary;
};

exports.updateBulk = async (user, salaries) => {
  let netSalaryTotal = 0;
  for (let salary of salaries) {
    netSalaryTotal += salary.netSalary;
  }

  if (netSalaryTotal === 0) {
    return;
  }

  for (let salary of salaries) {
    await Salary.findOneAndUpdate(
      {
        date: salary.date,
        branchID: salary.branchID,
        employeeID: salary.employeeID,
      },
      salary,
      {
        upsert: true,
      }
    );
  }

  await financialService.updateSalariesAndNetIncome(
    salaries[0].branchID,
    salaries[0].date,
    user._id
  );

  return;
};
