const { NotFoundException } = require("../common/errors/exceptions");

const PAGE_SIZE = require("../common/constants").PAGE_SIZE;
const companyService = require("./service");

exports.getAllCompanies = async (req, res) => {
  let page = 1;

  let count = await companyService.getCount();
  count < PAGE_SIZE ? (count = 1) : (count = count);

  if (req.query.p) {
    page = req.query.p;
  }

  let companies = await companyService.getAllCompaniesWithPagination(page);
  for (company of companies) {
    if (company.companyImage) {
      company.width = "100px";
      company.height = "100px";
    } else {
      company.width = "0px";
      company.height = "0px";
    }
  }

  res.render("company/viewCompanies.hbs", {
    companies,
    pagination: {
      page,
      pageCount: Math.ceil(count / PAGE_SIZE),
    },
  });
};

exports.createCompany = async (req, res) => {
  try {
    let companyName = req.body.companyName;
    let companyImage = req.file.filename;
    let phoneNumber = req.body.phoneNumber;
    let email = req.body.email;
    let location = req.body.location;
    let notes = req.body.notes;

    let message = await companyService.createCompany(
      companyName,
      companyImage,
      phoneNumber,
      email,
      location,
      notes
    );

    res.render("company/addCompany.hbs", {
      successMessage: message,
    });
  } catch (error) {
    res.status(error.status).render("company/addCompany.hbs", {
      errorMessage: error.message,
    });
  }
};

exports.getCompanyById = async (req, res) => {
  let id = req.params.id;
  let company = await companyService.getCompanyById(id);

  if (!company) {
    throw new NotFoundException("Company not found");
  }

  res.render("user/viewUsers.hbs", { companies });
};

exports.deleteCompany = async (req, res) => {
  try {
    const id = req.params.id;
    await companyService.deleteCompany(id);

    res.send({ message: "حذفت الشركة بنجاح" });
  } catch (error) {
    console.log(error, error.status, error.message);
    res.status(error.status).send({ errorMessage: error.message });
  }
};

exports.addCompany = async (req, res) => {
  res.render("company/addCompany.hbs");
};

exports.updateCompany = async (req, res) => {
  try {
    let id = req.params.id;
    let companyName = req.body.companyName;
    let phoneNumber = req.body.phoneNumber;
    let email = req.body.email;
    let location = req.body.location;
    let notes = req.body.notes;

    let companyImage = null;
    if (req.file) {
      companyImage = req.file.filename;
    }

    let company = await companyService.updateCompany(
      id,
      companyName,
      companyImage,
      phoneNumber,
      email,
      location,
      notes
    );

    res.render("company/editCompany.hbs", {
      company,
      successMessage: " تم تعديل بيانات الشركة",
    });
  } catch (error) {
    console.log(error);
    res.status(error.status).render("company/editCompany.hbs", {
      errorMessage: error.message,
    });
  }
};

exports.showEdit = async (req, res) => {
  const id = req.params.id;
  const company = await companyService.getCompanyById(id);

  res.render("company/editCompany.hbs", { company });
};

exports.viewCompany = async (req, res) => {
  const id = req.params.id;
  const company = await companyService.getCompanyById(id);

  res.render("company/viewCompany.hbs", { company });
};

exports.hideCompany = async (req, res) => {
  try {
    const id = req.params.id;
    const fromDate = req.body.fromDate || new Date();
    await companyService.hideCompany(id, fromDate);
    res.send({ message: "تم إخفاء الشركة بنجاح" });
  } catch (error) {
    res.status(error.status || 500).send({ errorMessage: error.message });
  }
};

exports.unhideCompany = async (req, res) => {
  try {
    const id = req.params.id;
    await companyService.unhideCompany(id);
    res.send({ message: "تم إظهار الشركة بنجاح" });
  } catch (error) {
    res.status(error.status || 500).send({ errorMessage: error.message });
  }
};
