const jwt = require("jsonwebtoken");
const userService = require("../user/service");

const {
  UnauthenticatedException,
  UnauthorizedException,
} = require("../common/errors/exceptions");

const auth = async (req, res, next) => {
  try {
    const token = req.cookies["auth_token"];

    if (!token) {
      return res.render("login.hbs");
    }

    const decoded = jwt.verify(token, "ASDSADKSADKSKLASNKLAS45");
    const user = await userService.getUser({
      _id: decoded._id,
      token: token,
    });

    if (!user) {
      res.clearCookie("auth_token");
      throw new UnauthenticatedException(
        "اسم المستخدم أو كلمة المرور غير صحيحة"
      );
    }

    if (user.blocked) {
      res.clearCookie("auth_token");
      throw new UnauthenticatedException(
        "المستخدم محظور , الرجاء مراجعة الإدارة"
      );
    }

    if (user.branchID) {
      user.branchedRole = true;
    }

    req.token = token;
    req.user = user;
    next();
  } catch (e) {
    res.clearCookie("auth_token");

    if (e.name === "TokenExpiredError") {
      return res.render("login.hbs", {
        errorMessage: "انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى",
      });
    }

    return res.render("login.hbs");
  }
};

const isAdmin = async (req, res, next) => {
  if (req.user.role === "Admin" || req.user.role === "SuperAdmin") {
    return next();
  }

  res.redirect("/");
};

const isSuperAdmin = async (req, res, next) => {
  if (req.user.role === "SuperAdmin") {
    return next();
  }

  res.redirect("/");
};

function authRole(roles) {
  return (req, res, next) => {
    if (
      req.user.role !== roles &&
      req.user.role !== "Admin" &&
      !roles.includes(req.user.role)
    ) {
      return res.redirect("/");
    }
    next();
  };
}

module.exports = { auth, authRole, isAdmin, isSuperAdmin };
