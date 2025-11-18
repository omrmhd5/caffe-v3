const Transfer = require("../../models/transfer");

exports.getAll = async (branchID) => {
  if (!branchID) {
    return [];
  }

  const transfers = await Transfer.find({ branchID })
    .sort({ createdAt: 1 })
    .populate("branchID", "branchname");

  return transfers.map((transfer) => ({
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
