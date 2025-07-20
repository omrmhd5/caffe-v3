const Note = require("../../models/salaryNote");

exports.addBulk = async (notes) => {
  if (notes.length > 0) {
    await Note.deleteMany({
      date: notes[0].date,
      branchID: notes[0].branchID,
    });

    await Note.insertMany(notes);
  }
};

exports.getNotes = async (branchID, date, user) => {
  let notes = await Note.find({
    branchID,
    date,
  }).lean();

  notes = notes.map((note) => {
    user.role != "AccountantManager"
      ? (note.disabled = "disabled")
      : (note.disabled = "");
    return note;
  });

  return [notes];
};
