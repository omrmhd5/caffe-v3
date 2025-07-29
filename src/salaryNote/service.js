const Note = require("../../models/salaryNote");
const { toMonthStartDate } = require("../common/date");

exports.addBulk = async (notes) => {
  if (notes.length > 0) {
    // Normalize the date to the first day of the month
    const normalizedDate = toMonthStartDate(notes[0].date);

    await Note.deleteMany({
      date: normalizedDate,
      branchID: notes[0].branchID,
    });

    // Update all notes to use the normalized date
    const notesWithNormalizedDate = notes.map((note) => ({
      ...note,
      date: normalizedDate,
    }));

    await Note.insertMany(notesWithNormalizedDate);
  }
};

exports.getNotes = async (branchID, date, user) => {
  // Normalize the date to the first day of the month
  const normalizedDate = toMonthStartDate(date);

  let notes = await Note.find({
    branchID,
    date: normalizedDate,
  }).lean();

  notes = notes.map((note) => {
    user.role != "AccountantManager"
      ? (note.disabled = "disabled")
      : (note.disabled = "");
    return note;
  });

  return [notes];
};
