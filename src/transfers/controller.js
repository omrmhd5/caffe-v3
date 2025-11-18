const branchService = require("../branch/service");
const transferService = require("./service");
const paymentValueService = require("../paymentValue/service");
const dateUtility = require("../common/date");

exports.getAll = async (req, res) => {
  let branchID = null;
  let branch = null;
  let branches = await branchService.getAllBranches(req.user.companyID);

  if (req.user.branchedRole) {
    branchID = req.user.branchID;
    branch = await branchService.getBranchById(branchID);
  } else {
    branchID = req.query.branchID;
    if (branchID) {
      branch = await branchService.getBranchById(branchID);
    }
    branches = branches.map((branchItem) => {
      if (branchItem._id == branchID) {
        branchItem.selected = "selected";
      }
      return branchItem;
    });
  }

  // Get transfers data for the selected branch
  const data = branchID ? await transferService.getAll(branchID) : [];

  res.render("transfers/transfersReport.hbs", {
    branches,
    branch,
    branchID,
    branchedRole: req.user.branchedRole,
    data,
    expreq: req,
  });
};

exports.addTransfers = async (req, res) => {
  try {
    let transfers = req.body.transfers;

    // Parse JSON if it's a string (following the pattern from other controllers)
    if (typeof transfers === "string") {
      transfers = JSON.parse(transfers);
    }

    if (!transfers || !Array.isArray(transfers)) {
      return res.status(400).send({ errorMessage: "Invalid transfers data" });
    }

    const branchID = req.user.branchedRole
      ? req.user.branchID
      : req.body.branchID;

    if (!branchID) {
      return res.status(400).send({ errorMessage: "Branch ID is required" });
    }

    // Process each transfer - separate updates and new records
    const transfersToUpdate = [];
    const transfersToCreate = [];

    for (const transfer of transfers) {
      // Calculate commission voucher and bank fees
      const reservationAmount = parseFloat(transfer.reservationAmount) || 0;
      const sentAmount = parseFloat(transfer.sentAmount) || 0;
      const transferredAmount = parseFloat(transfer.transferredAmount) || 0;

      const commissionVoucher = reservationAmount - transferredAmount;
      const bankFees = sentAmount - transferredAmount;

      const transferData = {
        branchID: branchID,
        companyName: transfer.companyName || "",
        reservationRef: transfer.reservationRef || "",
        reservationAmount: reservationAmount,
        sentAmount: sentAmount,
        transferredAmount: transferredAmount,
        commissionVoucher: commissionVoucher,
        bankFees: bankFees,
        voucherNumber: transfer.voucherNumber || "",
        notes: transfer.notes || "",
        approved:
          transfer.approved === true ||
          transfer.approved === "true" ||
          transfer.approved === "نعم",
      };

      // Only include reservationDate if it's provided and not empty
      // For updates, we'll preserve the existing date in the service if not provided
      if (transfer.reservationDate && transfer.reservationDate.trim() !== "") {
        transferData.reservationDate = transfer.reservationDate;
      }

      // If _id exists and is not empty/null, it's an update; otherwise, it's a new record
      const hasValidId =
        transfer._id &&
        transfer._id !== null &&
        transfer._id !== "null" &&
        transfer._id !== "" &&
        (typeof transfer._id === "string" ? transfer._id.trim() !== "" : true);

      if (hasValidId) {
        transfersToUpdate.push({ id: transfer._id, data: transferData });
      } else {
        // For new records, approved value is already set correctly from transferData.approved (line 83)
        // Don't override it - preserve the value from the frontend
        transfersToCreate.push(transferData);
      }
    }

    // Update existing transfers
    for (const { id, data } of transfersToUpdate) {
      try {
        // Get existing transfer to check if approved status changed
        const existingTransfer = await transferService.getTransferById(id);
        const wasApproved = existingTransfer?.approved || false;
        const isNowApproved = data.approved === true;
        const existingAmount = existingTransfer?.reservationAmount || 0;
        const newAmount = data.reservationAmount || 0;

        const updatedTransfer = await transferService.updateTransfer(id, data);

        // If approved changed from false to true, add to receivedValues
        if (!wasApproved && isNowApproved && newAmount > 0) {
          await updateReceivedAmountForTransfer(
            updatedTransfer,
            newAmount
          );
        }

        // If approved changed from true to false, subtract from receivedValues
        if (wasApproved && !isNowApproved && existingAmount > 0) {
          await subtractReceivedAmountForTransfer(
            updatedTransfer,
            existingAmount
          );
        }

        // If record was approved and is still approved, but amount changed
        if (wasApproved && isNowApproved && existingAmount !== newAmount) {
          // Subtract the old amount
          if (existingAmount > 0) {
            await subtractReceivedAmountForTransfer(
              updatedTransfer,
              existingAmount
            );
          }
          // Add the new amount
          if (newAmount > 0) {
            await updateReceivedAmountForTransfer(
              updatedTransfer,
              newAmount
            );
          }
        }
      } catch (error) {
        throw error;
      }
    }

    // Create new transfers
    if (transfersToCreate.length > 0) {
      try {
        const createdTransfers = await transferService.addMultipleTransfers(
          transfersToCreate
        );

        // For each created transfer, if approved is true, add to receivedValues
        for (let i = 0; i < createdTransfers.length; i++) {
          const transfer = createdTransfers[i];
          const transferData = transfersToCreate[i];

          if (
            transferData.approved === true &&
            transferData.reservationAmount > 0
          ) {
            await updateReceivedAmountForTransfer(
              transfer,
              transferData.reservationAmount
            );
          }
        }
      } catch (error) {
        throw error;
      }
    }

    res.send({ message: "! تم الحفظ بنجاح" });
  } catch (error) {
    res
      .status(error.status || 500)
      .send({ errorMessage: error.message || "Failed to save transfers" });
  }
};

// Helper function to update received amount in PaymentValue
async function updateReceivedAmountForTransfer(transfer, amount) {
  try {
    // Get the creation date of the transfer - use createdAt from the transfer document
    // This ensures we use the month when the transfer was created, not any other date
    const transferDate = transfer.createdAt;

    if (!transferDate) {
      return;
    }

    // Normalize to first day of month using the creation date
    const normalizedDate = dateUtility.toMonthStartDate(transferDate);

    // Get existing payment value
    const existingPaymentValue = await paymentValueService.getPaymentValue(
      transfer.branchID,
      normalizedDate
    );

    // Get current receivedValues or initialize with zeros
    let receivedValues = existingPaymentValue?.receivedValues || [
      0, 0, 0, 0, 0,
    ];

    // Ensure array has exactly 5 elements
    while (receivedValues.length < 5) {
      receivedValues.push(0);
    }
    receivedValues = receivedValues.slice(0, 5);

    // Add the amount to the first available slot (first zero or first field)
    // Or add to the first field if all are non-zero
    let added = false;
    for (let i = 0; i < receivedValues.length; i++) {
      if (receivedValues[i] === 0) {
        receivedValues[i] = parseFloat(amount);
        added = true;
        break;
      }
    }

    // If all fields have values, add to the first field (accumulate)
    if (!added) {
      receivedValues[0] =
        (parseFloat(receivedValues[0]) || 0) + parseFloat(amount);
    }

    // Update payment value
    await paymentValueService.addPaymentValue({
      branchID: transfer.branchID,
      date: normalizedDate,
      receivedValues: receivedValues,
      paidValues: existingPaymentValue?.paidValues || [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      ],
      approved: existingPaymentValue?.approved || false,
    });
  } catch (error) {
    // Don't throw - we don't want to fail the transfer save if this fails
  }
}

// Helper function to subtract received amount from PaymentValue when approved changes to false
async function subtractReceivedAmountForTransfer(transfer, amount) {
  try {
    // Get the creation date of the transfer - use createdAt from the transfer document
    const transferDate = transfer.createdAt;

    if (!transferDate) {
      return;
    }

    // Normalize to first day of month using the creation date
    const normalizedDate = dateUtility.toMonthStartDate(transferDate);

    // Get existing payment value
    const existingPaymentValue = await paymentValueService.getPaymentValue(
      transfer.branchID,
      normalizedDate
    );

    if (!existingPaymentValue) {
      return;
    }

    // Get current receivedValues
    let receivedValues = existingPaymentValue.receivedValues || [0, 0, 0, 0, 0];

    // Ensure array has exactly 5 elements
    while (receivedValues.length < 5) {
      receivedValues.push(0);
    }
    receivedValues = receivedValues.slice(0, 5);

    // Try to find and subtract the exact amount from any field
    // If exact match found, set it to 0; otherwise subtract from first non-zero field
    let subtracted = false;
    const amountToSubtract = parseFloat(amount);

    // First, try to find exact match
    for (let i = 0; i < receivedValues.length; i++) {
      if (Math.abs(parseFloat(receivedValues[i]) - amountToSubtract) < 0.01) {
        receivedValues[i] = 0;
        subtracted = true;
        break;
      }
    }

    // If no exact match, subtract from the first non-zero field
    if (!subtracted) {
      for (let i = 0; i < receivedValues.length; i++) {
        const currentValue = parseFloat(receivedValues[i]) || 0;
        if (currentValue > 0) {
          receivedValues[i] = Math.max(0, currentValue - amountToSubtract);
          subtracted = true;
          break;
        }
      }
    }

    // If still not subtracted (all fields are zero), return
    if (!subtracted) {
      return;
    }

    // Update payment value
    await paymentValueService.addPaymentValue({
      branchID: transfer.branchID,
      date: normalizedDate,
      receivedValues: receivedValues,
      paidValues: existingPaymentValue.paidValues || [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      ],
      approved: existingPaymentValue.approved || false,
    });
  } catch (error) {
    // Don't throw - we don't want to fail the transfer save if this fails
  }
}
