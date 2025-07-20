const express = require("express");
const moment = require("moment");
const path = require("path");
const _ = require("underscore");
const app = express();
const hbs = require("hbs");
const paginate = require("handlebars-paginate");
const numeral = require("numeral");

require("dotenv").config();
require("./db/mongoose");

const branchRoutes = require("./src/branch/router");
const userRoutes = require("./src/user/router");
const companyRoutes = require("./src/company/router");
const employeeRoutes = require("./src/employee/router");
const itemRoutes = require("./src/item/router");
const salesRoutes = require("./src/sales/router");
const storeRoutes = require("./src/store/router");
const custodyRoutes = require("./src/custody/router");
const requestRoutes = require("./src/custodyRequest/router");
const invoiceRoutes = require("./src/invoice/router");
const salaryRoutes = require("./src/salary/router");
const financialRoutes = require("./src/financial/router");
const dailyIncomeRoutes = require("./src/dailyIncome/router");
const indexRoutes = require("./src/routes/index");
const taxValueRoutes = require("./src/taxValue/router");

const cookieParser = require("cookie-parser");

const port = process.env.PORT || 3000;

hbs.localsAsTemplateData(app);
hbs.registerPartials(path.join(__dirname, "./public/partials"));
hbs.registerHelper("paginate", paginate);
hbs.registerHelper("json", function (content) {
  if (!content || _.isEqual(content, {})) {
    return " ";
  }
  return JSON.stringify(content);
});
hbs.registerHelper("check", function (value) {
  if (!value) {
    return "لا يوجد";
  }
  return value;
});
hbs.registerHelper("isChecked", function (value) {
  if (!value) {
    return "";
  }
  return "checked";
});
hbs.registerHelper("isBlocked", function (value) {
  if (!value) {
    return "checked";
  }
  return "";
});
hbs.registerHelper("ifEquals", function (arg1, arg2, options) {
  return arg1 == arg2 ? options.fn(this) : options.inverse(this);
});
hbs.registerHelper("ifNotEquals", function (arg1, arg2, options) {
  return arg1 != arg2 ? options.fn(this) : options.inverse(this);
});
hbs.registerHelper("incremented", function (index) {
  index++;
  return index;
});
hbs.registerHelper("forLoop", function (n, block) {
  let accum = "";
  for (let i = 0; i < n; ++i) accum += block.fn(i);
  return accum;
});
hbs.registerHelper("formatDate", function (datetime) {
  if (!datetime) {
    return "--";
  }
  return moment(datetime).format("YYYY-MM-DD");
});
hbs.registerHelper("formatDateTime", function (datetime) {
  if (!datetime) {
    return "--";
  }
  return moment(datetime).format("YYYY-MM-DD hh:mm");
});
hbs.registerHelper("checkOrZeror", function (value) {
  if (!value) {
    return 0;
  }
  return value;
});
hbs.registerHelper("toFixed", function (value) {
  if (value) {
    return parseFloat(value).toFixed(2);
  }

  return 0;
});
hbs.registerHelper("todayDate", function () {
  new Date();
});
hbs.registerHelper("isDisabled", function (isDisabled) {
  return isDisabled ? "disabled" : "";
});
hbs.registerHelper("multiply", function (val1, val2) {
  return val1 * val2;
});
hbs.registerHelper("checkColor", function (value) {
  if (!value) {
    return "not-set";
  }
  return "";
});
hbs.registerHelper("numeral", function (value) {
  if (!value) {
    return "00.00";
  }
  return numeral(value).format("0,0.00");
});
hbs.registerHelper("today", function () {
  return moment().format("YYYY-MM-DD");
});

app.use(cookieParser());
app.use(express.static(path.join(__dirname, "./public")));
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "./public/views"));
app.use(function (req, res, next) {
  app.locals.expreq = req;
  next();
});
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use("/branches", branchRoutes);
app.use("/users", userRoutes);
app.use("/companies", companyRoutes);
app.use("/employees", employeeRoutes);
app.use("/items", itemRoutes);
app.use("/sales", salesRoutes);
app.use("/store", storeRoutes);
app.use("/custody", custodyRoutes);
app.use("/custodyRequest", requestRoutes);
app.use("/salary", salaryRoutes);
app.use("/invoice", invoiceRoutes);
app.use("/financial", financialRoutes);
app.use("/dailyIncome", dailyIncomeRoutes);
app.use("/taxValue", taxValueRoutes);

app.use("/", indexRoutes);

app.listen(port, "", () => {
  console.log("Server has started");
});
