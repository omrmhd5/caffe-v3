const {
  NotFoundException,
  BadRequestException,
} = require("../common/errors/exceptions");

const PAGE_SIZE = require("../common/constants").PAGE_SIZE;
const ROLES = require("../common/constants").ADD_USER_ROLES;
const User = require("../../models/user");
const userService = require("./service");
const branchService = require("../branch/service");
const companyService = require("../company/service");
const responseWrapper = require("../common/response/success");

exports.getAllUsers = async (req, res) => {
  let page = 1;
  let roles = [];
  let userRole = null;
  let companyID = null;
  let branchID = null;
  let branches = await branchService.getAllBranches(req.user.companyID);

  if (req.query.companyID) {
    companyID = req.query.companyID;
  }

  if (req.query.branchID) {
    branchID = req.query.branchID;
    branches = branches.map((branch) => {
      if (branch._id == branchID) {
        branch.selected = "selected";
      }
      return branch;
    });
  }

  if (req.query.role) {
    userRole = req.query.role;
  }

  if (req.query.p) {
    page = req.query.p;
  }

  let allCompanies = await companyService.getAllCompanies();
  let companies = [];
  for (company of allCompanies) {
    if (company._id == companyID) {
      companies.push({ ...company, selected: "selected" });
    } else {
      companies.push(company);
    }
  }

  let users = await userService.getAllUsersWithPagination(
    req.user,
    companyID,
    branchID,
    userRole,
    page
  );

  let count = await userService.getCount(
    req.user,
    companyID,
    branchID,
    userRole
  );
  count < PAGE_SIZE ? (count = 1) : (count = count);

  for (role of ROLES) {
    if (role.value === userRole) {
      roles.push({ ...role, selected: "selected" });
    } else {
      roles.push(role);
    }
  }

  let view = "user/viewUsers.hbs";
  if (req.user.role === "SuperAdmin") {
    view = "user/_viewUsers.hbs";
  }

  res.render(view, {
    user: req.user,
    companies,
    companyID,
    branches,
    users,
    userRole,
    roles,
    pagination: {
      page,
      pageCount: Math.ceil(count / PAGE_SIZE),
    },
  });
};

exports.getUserById = async (req, res) => {
  let userId = req.params.id;
  let user = await userService.getUserById(userId);

  if (!user) {
    throw new NotFoundException("User not found");
  }

  return responseWrapper.success(res, user);
};

exports.deleteUser = async (req, res) => {
  try {
    let userId = req.params.id;
    let message = await userService.deleteUser(userId);

    res.send({ message });
  } catch (error) {
    console.log(error, error.status, error.message);
    res.status(error.status).send({ errorMessage: error.message });
  }
};

exports.addUser = async (req, res) => {
  try {
    let branches = await branchService.getAllBranches(req.user.companyID);

    res.render("user/addUser.hbs", {
      branches,
      roles: ROLES,
    });
  } catch (error) {}
};

exports.addAdmin = async (req, res) => {
  try {
    let companies = await companyService.getAllCompanies();

    res.render("user/addAdmin.hbs", {
      companies,
    });
  } catch (error) {}
};

exports.createAdmin = async (req, res) => {
  let companies = null;
  try {
    let role = "Admin";
    let fullName = req.body.fullName ? req.body.fullName : null;
    let userName = req.body.userName ? req.body.userName : null;
    let email = req.body.email ? req.body.email : null;
    let password = req.body.password ? req.body.password : null;
    let companyID = req.body.companyID;

    companies = await companyService.getAllCompanies({});
    await userService.createUser(
      req.user,
      role,
      fullName,
      userName,
      email,
      password,
      null,
      companyID
    );

    res.render("user/addAdmin.hbs", {
      successMessage: "أضيف المستخدم بنجاح",
      companies,
    });
  } catch (error) {
    console.log(error);
    res.render("user/addAdmin.hbs", {
      errorMessage: error.message,
      userName: req.body.userName,
      fullName: req.body.fullName,
      companies,
    });
  }
};

exports.createUser = async (req, res) => {
  let companies = null;
  try {
    let role = req.body.role;
    let fullName = req.body.fullName ? req.body.fullName : null;
    let userName = req.body.userName ? req.body.userName : null;
    let email = req.body.email ? req.body.email : null;
    let password = req.body.password ? req.body.password : null;
    let branchID = req.body.branchID ? req.body.branchID : null;

    let companyID = req.body.companyID;
    if (!companyID) {
      companyID = req.user.companyID;
    }

    companies = await companyService.getAllCompanies().populate("branches");
    await userService.createUser(
      req.user,
      role,
      fullName,
      userName,
      email,
      password,
      branchID,
      companyID
    );

    res.render("user/addUser.hbs", {
      successMessage: "أضيف المستخدم بنجاح",
      companies,
      roles: ROLES,
    });
  } catch (error) {
    console.log(error);
    res.render("user/addUser.hbs", {
      errorMessage: error.message,
      userName: req.body.userName,
      fullName: req.body.fullName,
      email: req.body.email,
      role: req.body.role,
      companies,
      roles: ROLES,
    });
  }
};

exports.showEdit = async (req, res) => {
  try {
    const id = req.params.id;
    let user = await User.findById(id).populate("branchID");
    if (!user) {
      throw new NotFoundException("المستخدم غير موجود");
    }
    let branches = null;
    if (user.companyID) {
      branches = await branchService.getAllBranches(user.companyID);
    } else {
      branches = await branchService.getAllBranches(req.user.companyID);
    }

    res.render("user/editUser.hbs", {
      branches,
      user,
      roles: ROLES,
    });
  } catch (error) {}
};

exports.updateUser = async (req, res) => {
  let branches = null;
  let user = null;
  try {
    const id = req.params.id;
    user = await userService.getUserById(id);
    if (!user) {
      throw new NotFoundException("المستخدم غير موجود");
    }

    if (user.companyID) {
      branches = await branchService.getAllBranches(user.companyID);
    } else {
      branches = await branchService.getAllBranches(req.user.companyID);
    }

    req.body.id = id;
    user = await userService.updateUser(req.body);

    res.render("user/editUser.hbs", {
      successMessage: "تم تعديل بيانات المستخدم",
      branches,
      user,
      roles: ROLES,
    });
  } catch (error) {
    res.render("user/editUser.hbs", {
      errorMessage: error.message,
      branches,
      user,
      roles: ROLES,
    });
  }
};

exports.blockUser = async (req, res) => {
  try {
    let block = req.body.block;
    let message = await userService.blockUser(req.params.id, block);
    res.send({ message });
  } catch (error) {
    console.log(error, error.status, error.message);
    res.status(error.status).send({ errorMessage: error.message });
  }
};

exports.showLogin = async (req, res) => {
  return res.render("login.hbs");
};

exports.loginUser = async (req, res) => {
  try {
    let username = req.body.username;
    let password = req.body.password;

    let user = await userService.loginUser(username, password);
    res.cookie("auth_token", user.token);

    res.redirect("/");
  } catch (error) {
    console.log(error, error.status, error.message);
    return res.render("login.hbs", { errorMessage: error.message });
  }
};

exports.showChangePassword = async (req, res) => {
  return res.render("user/changePassword.hbs");
};

exports.changePassword = async (req, res) => {
  try {
    let currentPassword = req.body.currentPassword;
    let newPassword = req.body.newPassword;

    let message = await userService.changePassword(
      req.user._id,
      currentPassword,
      newPassword
    );

    res.render("user/changePassword.hbs", { successMessage: message });
  } catch (error) {
    console.log(error, error.status, error.message);
    return res.render("user/changePassword.hbs", {
      errorMessage: error.message,
    });
  }
};

exports.showResetPasswordRequest = async (req, res) => {
  return res.render("resetPasswordRequest.hbs");
};

exports.resetPasswordRequest = async (req, res) => {
  try {
    let email = req.body.email;
    if (!email) {
      throw new BadRequestException("يرجى إدخال البريد الإلكتروني");
    }

    let message = await userService.resetPasswordRequest(email);

    res.render("resetPasswordRequest.hbs", { successMessage: message });
  } catch (error) {
    console.log(error, error.status, error.message);
    return res.render("resetPasswordRequest.hbs", {
      errorMessage: error.message,
    });
  }
};

exports.showResetPassword = async (req, res) => {
  const token = req.query.token;
  return res.render("resetPassword.hbs", { token });
};

exports.resetPassword = async (req, res) => {
  try {
    let email = req.body.email;
    let password = req.body.password;
    let token = req.body.token;

    if (!email) {
      throw new BadRequestException("يرجى إدخال البريد الإلكتروني");
    }

    if (!password) {
      throw new BadRequestException("يرجى إدخال  كلمة المرور الجديدة");
    }

    if (!token) {
      throw new BadRequestException("البيانات المدخلة ناقصة");
    }

    let message = await userService.resetPassword(email, token, password);

    res.render("resetPassword.hbs", { successMessage: message });
  } catch (error) {
    console.log(error, error.status, error.message);
    return res.render("resetPassword.hbs", {
      errorMessage: error.message,
    });
  }
};

exports.logout = async (req, res) => {
  try {
    await userService.logout(req.user._id);
    res.redirect("/users/login");
  } catch (e) {
    res.status(500).render("error.hbs");
  }
};
