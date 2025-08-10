const jwt = require("jsonwebtoken");
const userService = require("../user/service");

const {
  UnauthenticatedException,
  UnauthorizedException,
} = require("../common/errors/exceptions");

// Helper function to check if token is about to expire (within 120 seconds)
const isTokenExpiringSoon = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return true;

    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - now;

    // Refresh if token expires within 120 seconds
    return timeUntilExpiry <= 120;
  } catch (error) {
    return true;
  }
};

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
    if (isTokenExpiringSoon(token)) {
      try {
        // Generate new token for sliding session
        const newToken = await userService.generateAuthToken(user);
        user.token = newToken;
        await user.save();

        // Set new cookie with refreshed token
        res.cookie("auth_token", newToken, {
          maxAge: 1000 * 60 * 5,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        });

        req.token = newToken;
      } catch (refreshError) {
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
