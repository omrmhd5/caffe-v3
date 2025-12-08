const Transfer = require("../../models/transfer");
const moment = require("moment");

exports.getAll = async (branchID, date) => {
  if (!branchID) {
    return [];
  }

  const query = { branchID };

  const transfers = await Transfer.find(query)
    .sort({ createdAt: 1 })
    .populate("branchID", "branchname");

  // Filter by reservationDate month if date is provided
  let filteredTransfers = transfers;
  if (date) {
    const targetMonth = moment(date, "YYYY-MM");
    filteredTransfers = transfers.filter((transfer) => {
      if (!transfer.reservationDate || transfer.reservationDate.trim() === "") {
        return false;
      }
      // Parse reservationDate format: "HH:mm:ss mm/dd/yyyy"
      const datePart = transfer.reservationDate.split(" ")[1];
      if (!datePart) {
        return false;
      }
      // Parse mm/dd/yyyy
      const [month, day, year] = datePart.split("/");
      if (!month || !day || !year) {
        return false;
      }
      const reservationMoment = moment(
        `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
        "YYYY-MM-DD"
      );
      return (
        reservationMoment.month() === targetMonth.month() &&
        reservationMoment.year() === targetMonth.year()
      );
    });
  }

  return filteredTransfers.map((transfer) => ({
    _id: transfer._id,
    branchName: transfer.branchID?.branchname || "",
    companyName: transfer.companyName,
    reservationRef: transfer.reservationRef,
    reservationDate: transfer.reservationDate,
    reservationAmount: transfer.reservationAmount,
    sentAmount: transfer.sentAmount,
    transferredAmount: transfer.transferredAmount,
    commissionVoucher: transfer.commissionVoucher,
    bankFees: transfer.bankFees,
    voucherNumber: transfer.voucherNumber,
    notes: transfer.notes,
    approved: transfer.approved,
    createdAt: transfer.createdAt,
    transferredAmountUpdatedAt: transfer.transferredAmountUpdatedAt,
  }));
};

exports.addTransfer = async (transferData) => {
  const transfer = new Transfer(transferData);
  await transfer.save();
  return transfer;
};

exports.addMultipleTransfers = async (transfersArray) => {
  const transfers = await Transfer.insertMany(transfersArray);
  return transfers;
};

exports.updateTransfer = async (transferId, updateData) => {
  // Get existing transfer to preserve reservationDate if not provided in update
  const existingTransfer = await Transfer.findById(transferId);
  if (!existingTransfer) {
    throw new Error("Transfer not found");
  }
  
  // Always preserve the existing reservationDate - it should never be updated after first save
  // Only use the provided date if it's a new record (no existing date)
  if (!existingTransfer.reservationDate || existingTransfer.reservationDate.trim() === "") {
    // Only update if we have a new date to set
    if (updateData.reservationDate && updateData.reservationDate.trim() !== "") {
      // Keep the new date
    } else {
      // No date provided, keep empty
      updateData.reservationDate = existingTransfer.reservationDate || "";
    }
  } else {
    // Existing date exists - always preserve it, never update
    updateData.reservationDate = existingTransfer.reservationDate;
  }
  
  // Handle transferredAmount: compare with existing value and only update timestamp if changed
  const existingTransferredAmount = existingTransfer.transferredAmount || 0;
  const newTransferredAmount = updateData.transferredAmount !== undefined && updateData.transferredAmount !== null 
    ? (parseFloat(updateData.transferredAmount) || 0) 
    : existingTransferredAmount;
  
  if (updateData.transferredAmount === undefined || updateData.transferredAmount === null) {
    // Not provided - preserve existing value and timestamp
    updateData.transferredAmount = existingTransferredAmount;
    updateData.transferredAmountUpdatedAt = existingTransfer.transferredAmountUpdatedAt;
    
    // Recalculate commissionVoucher and bankFees with preserved transferredAmount
    const reservationAmount = updateData.reservationAmount !== undefined ? updateData.reservationAmount : existingTransfer.reservationAmount || 0;
    const sentAmount = updateData.sentAmount !== undefined ? updateData.sentAmount : existingTransfer.sentAmount || 0;
    updateData.commissionVoucher = reservationAmount - existingTransferredAmount;
    updateData.bankFees = sentAmount - existingTransferredAmount;
  } else {
    // Provided - compare with existing value
    updateData.transferredAmount = newTransferredAmount;
    
    // Only update timestamp if the value actually changed
    if (newTransferredAmount !== existingTransferredAmount) {
      if (newTransferredAmount > 0) {
        // Value changed and is > 0, set new timestamp
        updateData.transferredAmountUpdatedAt = new Date();
      } else {
        // Value changed to 0, clear timestamp
        updateData.transferredAmountUpdatedAt = null;
      }
    } else {
      // Value didn't change, preserve existing timestamp
      updateData.transferredAmountUpdatedAt = existingTransfer.transferredAmountUpdatedAt;
    }
  }
  
  const transfer = await Transfer.findByIdAndUpdate(
    transferId,
    updateData,
    { new: true, runValidators: true }
  );
  return transfer;
};

exports.getTransferById = async (transferId) => {
  const transfer = await Transfer.findById(transferId);
  return transfer;
};

exports.deleteTransfer = async (transferId) => {
  await Transfer.findByIdAndDelete(transferId);
};
