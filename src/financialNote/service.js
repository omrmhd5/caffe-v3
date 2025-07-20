const FinancialNote = require("../../models/financialNote");

exports.getByDate = (date, companyID) => {
  return FinancialNote.find({
    date,
    companyID,
  });
};

exports.getDoubledByDate = async (date, companyID) => {
  let notes = await FinancialNote.find({
    date,
    companyID,
  });

  let counter = 1;
  let arr = [];
  let result = [];
  for (let note of notes) {
    arr.push(note);
    if (counter % 2 === 0) {
      result.push(arr);
      arr = [];
    } else {
      if (counter == notes.length) {
        result.push(arr);
      }
    }
    counter++;
  }

  return result;
};

exports.update = async (id, date, note) => {
  await FinancialNote.findByIdAndUpdate(id, {
    date,
    note,
  });
};

exports.add = async (date, note) => {
  await FinancialNote.create({
    date: new Date(date),
    note,
  });
};

exports.addBulk = async (date, notes, companyID) => {
  await FinancialNote.deleteMany({
    date,
    companyID,
  });

  notes.forEach((n) => (n.companyID = companyID));
  await FinancialNote.insertMany(notes);
};
