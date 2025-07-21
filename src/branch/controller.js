const { NotFoundException } = require("../common/errors/exceptions");

const PAGE_SIZE = require("../common/constants").PAGE_SIZE;
const branchService = require("./service");
const companyService = require("../company/service");

exports.getAllBranches = async (req, res) => {
  let companyID = null;
  let page = 1;

  if (req.query.companyID) {
    companyID = req.query.companyID;
  }

  if (req.query.p) {
    page = req.query.p;
  }

  let companies = await companyService.getAllCompanies();
  companies = companies.map((company) => {
    if (company._id == companyID) {
      company.selected = "selected";
    }
    return company;
  });

  let branches = await branchService.getAllBranchesWithPagination(
    companyID,
    page
  );

  let count = await branchService.getCount(companyID);
  count < PAGE_SIZE ? (count = 1) : (count = count);

  res.render("branch/viewBranches.hbs", {
    branches,
    companies,
    companyID,
    pagination: {
      page,
      pageCount: Math.ceil(count / PAGE_SIZE),
    },
  });
};

exports.getBranchById = async (req, res) => {
  let id = req.params.id;
  let branch = await branchService.getBranchById(id);

  if (!branch) {
    throw new NotFoundException("Branch not found");
  }

  res.render("branch/viewBranches.hbs", { branch });
};

exports.addBranch = async (req, res) => {
  let companies = await companyService.getAllCompanies();
  res.render("branch/addBranch.hbs", { companies });
};

exports.createBranch = async (req, res) => {
  let companies = null;
  try {
    let branchName = req.body.branchName;
    let companyID = req.body.companyID;

    companies = await companyService.getAllCompanies();
    await branchService.createBranch(branchName, companyID);

    res.render("branch/addBranch.hbs", {
      successMessage: "أضيف بنجاح",
      companies,
    });
  } catch (error) {
    res.status(error.status).render("branch/addBranch.hbs", {
      errorMessage: error.message,
      companies,
    });
  }
};

exports.deleteBranch = async (req, res) => {
  try {
    const id = req.params.id;
    await branchService.deleteBranch(id);

    res.send({ message: "حذف الفرع بنجاح" });
  } catch (error) {
    console.log(error, error.status, error.message);
    res.status(error.status).send({ errorMessage: error.message });
  }
};

exports.showEdit = async (req, res) => {
  const id = req.params.id;
  const branch = await branchService.getBranchById(id);
  const companies = await companyService.getAllCompanies();
  const branchCompanyId = branch.companyID._id
    ? branch.companyID._id.toString()
    : branch.companyID.toString();
  companies.forEach((company) => {
    if (company._id.toString() === branchCompanyId) {
      company.selected = true;
    }
  });
  res.render("branch/editBranch.hbs", { branch, companies });
};

exports.updateBranch = async (req, res) => {
  try {
    const id = req.params.id;
    const branchName = req.body.branchName;
    const companyID = req.body.companyID;

    const branch = await branchService.updateBranch(id, branchName, companyID);
    const companies = await companyService.getAllCompanies();

    res.render("branch/editBranch.hbs", {
      branch,
      companies,
      successMessage: "تم تعديل بيانات الفرع",
    });
  } catch (error) {
    const companies = await companyService.getAllCompanies();
    res.status(error.status).render("branch/editBranch.hbs", {
      errorMessage: error.message,
      companies,
    });
  }
};

exports.hideBranch = async (req, res) => {
  try {
    const id = req.params.id;
    const fromDate = req.body.fromDate || new Date();
    await branchService.hideBranch(id, fromDate);
    res.send({ message: "تم إخفاء الفرع بنجاح" });
  } catch (error) {
    res.status(error.status || 500).send({ errorMessage: error.message });
  }
};

exports.unhideBranch = async (req, res) => {
  try {
    const id = req.params.id;
    await branchService.unhideBranch(id);
    res.send({ message: "تم إظهار الفرع بنجاح" });
  } catch (error) {
    res.status(error.status || 500).send({ errorMessage: error.message });
  }
};

exports.updateRentHistory = async (req, res) => {
  try {
    const id = req.params.id;
    const { value, fromDate } = req.body;
    await branchService.updateRentHistory(id, value, fromDate || new Date());
    res.send({ message: "تم تحديث الإيجار بنجاح" });
  } catch (error) {
    res.status(error.status || 500).send({ errorMessage: error.message });
  }
};
