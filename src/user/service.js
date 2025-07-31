const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("../../models/user");
const {
  NotFoundException,
  BadRequestException,
  UnauthenticatedException,
  UnauthorizedException,
} = require("../common/errors/exceptions");
const PAGE_SIZE = require("../common/constants").PAGE_SIZE;
const sendEmail = require("../common/email");

exports.createUser = async (
  user,
  role,
  fullName = null,
  username,
  email = null,
  password,
  branchID = null,
  companyID
) => {
  if (role === "Admin") {
    if (user.role !== "SuperAdmin") {
      throw new UnauthorizedException("ليس لديك الصلاحية");
    }
  }

  if (role === "Admin" || role === "AccountantManager" || role === "Manager") {
    user.branchID = null;
  }

  if (!companyID) {
    throw BadRequestException("الرجاء اختيار الشركة");
  }

  let data = {
    role,
    fullName,
    email,
    username,
    password,
    branchID,
    companyID,
  };

  let result = await User.findOne({ username, companyID });
  if (result) {
    throw new BadRequestException("اسم المستخدم موجود");
  }

  if (email) {
    let duplicateEmail = await User.findOne({ email });
    if (duplicateEmail) {
      throw new BadRequestException("البريد المستخدم موجود");
    }
  }

  await User.create(data);

  return;
};

exports.getAllUsers = (user, branchID, role = null) => {
  if (!companyID) {
    return [];
  }

  if (!role) {
    return User.find();
  }

  if (user.role == "SuperAdmin") {
    role = "Admin";
  }

  return User.find({ role, companyID: user.companyID });
};

exports.getAllUsersWithPagination = async (
  user,
  companyID,
  branchID,
  role,
  page
) => {
  let users = null;
  let find = {};

  find.companyID = user.companyID;
  find.role = {
    $ne: "Admin",
  };

  if (role) {
    find.role = role;
  }

  if (user.role == "SuperAdmin") {
    find.role = "Admin";

    if (companyID) {
      find.companyID = companyID;
    } else {
      delete find.companyID;
    }
  }

  if (branchID) {
    find.branchID = branchID;
  }

  users = await User.find(find)
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .populate("branchID")
    .populate("companyID")
    .sort("branchID")
    .lean();

  for (user of users) {
    if (user.blocked) {
      user.blockedMessage = "معطل";
    } else {
      user.blockedMessage = "يعمل";
    }
  }

  return users;
};

exports.getCount = (user, companyID, branchID, role) => {
  let find = {};

  find.companyID = user.companyID;

  if (role) {
    find.role = role;
  }

  if (user.role === "SuperAdmin") {
    find.companyID = companyID;
    find.role = "Admin";
  }

  if (branchID) {
    find.branchID = branchID;
  }

  return User.countDocuments(find);
};

exports.getUserById = (userId) => {
  return User.findById(userId);
};

exports.getUser = (options) => {
  return User.findOne(options).populate("branchID").populate("companyID");
};

exports.findByCerdenalties = async (username, password) => {
  const user = await User.findOne({ username });

  if (!user) {
    throw { error: "Username not found" };
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw { error: "Password is wrong" };
  }

  return user;
};

exports.updateUser = async ({
  id,
  role = null,
  fullName = null,
  username = null,
  email = null,
  password = null,
  branchID = null,
}) => {
  let update = {};

  if (branchID) update.branchID = new mongoose.Types.ObjectId(branchID);

  if (role) {
    if (role == "Admin" || role == "AccountantManager" || role == "Manager") {
      update.branchID = null;
    }

    update.role = role;
  }

  if (fullName) update.fullName = fullName;

  if (username) update.username = username;

  if (email) update.email = email;

  if (password) {
    update.password = await bcrypt.hash(password, 8);
  }

  let usernameDuplicate = await User.findOne({ _id: { $ne: id }, username });
  if (usernameDuplicate) {
    throw new BadRequestException("اسم المستخدم موجود");
  }

  let emailDuplicate = await User.findOne({ _id: { $ne: id }, email });
  if (emailDuplicate) {
    throw new BadRequestException("البريد المستخدم موجود");
  }

  user = await User.findByIdAndUpdate(id, update, { new: true }).populate(
    "branchID"
  );

  return user;
};

exports.blockUser = async (id, block) => {
  const user = await User.findById(id);
  if (!user) {
    throw new NotFoundException("لم يتم العثور على هذا المستخدم");
  }

  await User.findByIdAndUpdate(id, {
    blocked: block,
  });

  if (block === "true") {
    return " تم ايقاف المستخدم بنجاح";
  }
  return "تم تفعيل المستخدم بنجاح";
};

exports.deleteUser = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    throw new NotFoundException("لم يتم العثور على هذا المستخدم");
  }

  await User.findByIdAndDelete(id);

  return "تم حذف المستخدم بنجاح";
};

exports.loginUser = async (username, password) => {
  let user = await User.findOne({
    username,
  });

  if (!user) {
    throw new UnauthenticatedException("اسم المستخدم أو كلمة المرور غير صحيحة");
  }

  let isCorrect = await bcrypt.compare(password, user.password);
  if (!isCorrect) {
    throw new UnauthenticatedException("اسم المستخدم أو كلمة المرور غير صحيحة");
  }

  if (user.blocked) {
    throw new UnauthenticatedException(
      " المستخدم محظور , الرجاء مراجعة الإدارة"
    );
  }

  // Check if user's branch is hidden
  if (user.branchID) {
    const Branch = require("../../models/branch");
    const branch = await Branch.findById(user.branchID);

    if (branch && branch.hidden) {
      throw new UnauthenticatedException(
        "الفرع معطل حالياً، لا يمكن تسجيل الدخول. الرجاء مراجعة الإدارة"
      );
    }
  }

  // Check if user's company is hidden
  if (user.companyID) {
    const Company = require("../../models/company");
    const company = await Company.findById(user.companyID);

    if (company && company.hidden) {
      throw new UnauthenticatedException(
        "الشركة معطلة حالياً، لا يمكن تسجيل الدخول. الرجاء مراجعة الإدارة"
      );
    }
  }

  user.token = await exports.generateAuthToken(user);
  await user.save();

  delete user.password;

  return user;
};

exports.changePassword = async (id, currentPassword, newPassword) => {
  let user = await User.findById(id);

  let isCorrect = await bcrypt.compare(currentPassword, user.password);
  if (!isCorrect) {
    throw new BadRequestException("كلمة المرورالحالية غير صحيحة");
  }

  let isIdentical = await bcrypt.compare(newPassword, user.password);
  if (isIdentical) {
    throw new BadRequestException("كلمة المرور الجديدة مطابقة للقديمة  ");
  }

  user.password = newPassword;
  await user.save();

  return "تم تغيير كلمة المرور بنجاح";
};

exports.logout = async (id) => {
  let user = await User.findById(id);
  if (user) {
    user.token = null;
    await user.save();
  }
  return;
};

// Get all users affected by a branch being hidden
exports.getUsersByBranch = async (branchID) => {
  return User.find({ branchID }).populate("branchID").populate("companyID");
};

// Check if any users are affected by branch being hidden
exports.checkBranchUsers = async (branchID) => {
  const users = await User.find({ branchID });
  return users.length > 0;
};

// Get all users affected by a company being hidden
exports.getUsersByCompany = async (companyID) => {
  return User.find({ companyID }).populate("branchID").populate("companyID");
};

// Check if any users are affected by company being hidden
exports.checkCompanyUsers = async (companyID) => {
  const users = await User.find({ companyID });
  return users.length > 0;
};

exports.resetPasswordRequest = async (email) => {
  let user = await User.findOne({ email });
  if (!user) {
    throw new UnauthenticatedException("هذا البريد غير مسجل");
  }

  if (user.blocked) {
    throw new UnauthenticatedException(
      " المستخدم محظور , الرجاء مراجعة الإدارة"
    );
  }

  const token = await exports.generateAuthToken(user);
  user.token = token;
  await user.save();
  let baseUrl = process.env.BASE_URL;
  let url = `${baseUrl}/users/resetPassword?token=${user.token}`;
  await sendEmail(user.email, { name: user.username, url });

  return `تم إرسال رابط الاستعادة إلى البريد  ${email}`;
};

exports.resetPassword = async (email, token, newPassword) => {
  let user = await User.findOne({ email });
  if (!user) {
    throw new UnauthenticatedException("البيانات المدخلة غير صحيحة");
  }

  if (user.blocked) {
    throw new UnauthenticatedException(
      " المستخدم محظور , الرجاء مراجعة الإدارة"
    );
  }

  const decoded = jwt.verify(token, "ASDSADKSADKSKLASNKLAS45");
  user = await User.findOne({
    _id: decoded._id,
    token: token,
  });

  if (!user) {
    throw new UnauthenticatedException("البيانات المدخلة غير صحيحة");
  }

  user.password = newPassword;
  user.token = null;

  await user.save();
  return "تمت استعادة  كلمة المرور بنجاح";
};

exports.generateAuthToken = async function (user) {
  const token = jwt.sign(
    { _id: user._id.toString() },
    "ASDSADKSADKSKLASNKLAS45",
    { expiresIn: "5m" }
  );

  return token;
};
