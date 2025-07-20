const jwt = require("jsonwebtoken");
const userService = require("../user/service");

const {
  UnauthenticatedException,
  UnauthorizedException,
} = require("../common/errors/exceptions");

const auth = async (req, res, next) => {
  try {
    const token = req.cookies["auth_token"];
    const decoded = jwt.verify(token, "ASDSADKSADKSKLASNKLAS45");
    const user = await userService.getUser({
      _id: decoded._id,
      token: token,
    });

    if (!user) {
      throw new UnauthenticatedException(
        "اسم المستخدم أو كلمة المرور غير صحيحة"
      );
    }

    res.cookie("auth_token", user.token, {
      maxAge: 1000 * 60 * 10,
    });

    if (user.branchID) {
      user.branchedRole = true;
    }

    req.token = token;
    req.user = user;
    next();
  } catch (e) {
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
