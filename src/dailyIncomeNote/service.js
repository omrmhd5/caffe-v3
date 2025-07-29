const Note = require("../../models/dailyIncomeNote");
const { toMonthStartDate } = require("../common/date");

exports.addBulk = async (notes) => {
  if (notes.length > 0) {
    // Normalize the date to the first day of the month
    const normalizedDate = toMonthStartDate(notes[0].date);

    // Delete all existing notes for this date and branch
    await Note.deleteMany({
      date: normalizedDate,
      branchID: notes[0].branchID,
    });

    // Filter out empty notes and insert only non-empty ones
    const nonEmptyNotes = notes.filter(
      (note) => note.note && note.note.trim() !== ""
    );

    if (nonEmptyNotes.length > 0) {
      // Update all notes to use the normalized date
      const notesWithNormalizedDate = nonEmptyNotes.map((note) => ({
        ...note,
        date: normalizedDate,
      }));

      await Note.insertMany(notesWithNormalizedDate);
    }
  } else {
    // If no notes provided, delete all notes for this date and branch
    // This handles the case where all notes are cleared
    const normalizedDate = toMonthStartDate(new Date());
    await Note.deleteMany({
      date: normalizedDate,
      branchID: notes[0]?.branchID,
    });
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
    // Allow editing for all roles (non-manager roles can edit notes)
    note.disabled = "";
    return note;
  });

  return [notes];
};
