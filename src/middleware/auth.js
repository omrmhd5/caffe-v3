const userService = require("../user/service");
const tokenUtils = require("../common/token");

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

    // First verify the token to check if it's valid
    let decoded;
    try {
      decoded = tokenUtils.verifyAuthToken(token);
    } catch (verifyError) {
      if (verifyError.name === "TokenExpiredError") {
        // Token is expired, clear cookie and redirect to login
        res.clearCookie("auth_token");
        return res.render("login.hbs", {
          errorMessage: "انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى",
        });
      }
      // Other verification errors, clear cookie and redirect to login
      res.clearCookie("auth_token");
      return res.render("login.hbs");
    }

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

    // Check if user's branch is hidden on every request
    if (user.branchID) {
      const Branch = require("../../models/branch");
      const branch = await Branch.findById(user.branchID);

      if (branch && branch.hidden) {
        res.clearCookie("auth_token");
        throw new UnauthenticatedException(
          "الفرع معطل حالياً، لا يمكن تسجيل الدخول. الرجاء مراجعة الإدارة"
        );
      }

      user.branchedRole = true;
    }

    // Check if user's company is hidden on every request
    if (user.companyID) {
      const Company = require("../../models/company");
      const company = await Company.findById(user.companyID);

      if (company && company.hidden) {
        res.clearCookie("auth_token");
        throw new UnauthenticatedException(
          "الشركة معطلة حالياً، لا يمكن تسجيل الدخول. الرجاء مراجعة الإدارة"
        );
      }
    }

    // Only refresh token if it's about to expire (sliding session)
    if (tokenUtils.isTokenExpiringSoon(token)) {
      try {
        // Generate new token for sliding session using centralized utility
        const newToken = tokenUtils.generateAuthToken(user);
        user.token = newToken;
        await user.save();

        // Set new cookie with refreshed token
        res.cookie("auth_token", newToken, {
          maxAge: 1000 * 60 * 5,
          httpOnly: true,
          secure: false, // Set to false for better mobile compatibility
          sameSite: "lax", // Use "lax" which works better on mobile
          path: "/",
        });

        req.token = newToken;
      } catch (refreshError) {
        // If refresh fails, continue with current token
        req.token = token;
      }
    } else {
      req.token = token;
    }

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
