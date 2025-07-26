const moment = require("moment");

Date.prototype.toDateInputValue = function () {
  let local = new Date(this);
  local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
  return local.toJSON().slice(0, 7);
};

exports.addMonth = (date) => {
  date = moment(date);
  let fm = moment(date).add(1, "M");
  let fmEnd = moment(fm).endOf("month");
  return date.date() != fm.date() && fm.isSame(fmEnd.format("YYYY-MM-DD"))
    ? fm.add(1, "d")
    : fm;
};

exports.getToDate = (toDate) => {
  toDate = new Date(toDate);
  toDate.setDate(toDate.getDate() + 1);
  toDate.setHours(toDate.getHours() - 1);
  toDate.setMinutes(59);

  return toDate;
};

// Utility to normalize a date to the first day of the month at midnight UTC
exports.toMonthStartDate = (date) => {
  if (typeof date === "string" && /^\d{4}-\d{2}$/.test(date)) {
    return new Date(date + "-01T00:00:00.000Z");
  }
  const d = new Date(date);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1));
};
