// Get user role from data attribute (same pattern as existing codebase)
const userRoleContainer = document.querySelector("[data-user-role]");
const userRole = userRoleContainer
  ? userRoleContainer.getAttribute("data-user-role")
  : null;

const madaRatio = document.getElementById("mada-ratio");
const madaRatioSum = document.getElementById("mada-ratio-sum");
const madaRatioTotal = document.getElementById("mada-ratio-total");
const madaTax = document.getElementById("mada-tax");

const visaRatio = document.getElementById("visa-ratio");
const visaRatioSum = document.getElementById("visa-ratio-sum");
const visaRatioTotal = document.getElementById("visa-ratio-total");
const visaTax = document.getElementById("visa-tax");

const taxRatioTotal = document.getElementById("tax-ratio-total");

const taxButton = document.getElementById("tax-button");

const sendTaxRatioData = () => {
  let url = "/taxValue";
  let method = "POST";

  let date = $("#month").val();
  let branchID = $("#branchID").val();

  // Collect paid and received values
  const paidValues = [];
  $(".paid-field").each(function () {
    let val = parseFloat($(this).val());
    paidValues.push(isNaN(val) ? 0 : val);
  });

  // Ensure we have exactly 10 paid values
  while (paidValues.length < 10) {
    paidValues.push(0);
  }

  const receivedValues = [];
  $(".received-field").each(function () {
    let val = parseFloat($(this).val());
    receivedValues.push(isNaN(val) ? 0 : val);
  });

  // Ensure we have exactly 10 received values
  while (receivedValues.length < 10) {
    receivedValues.push(0);
  }

  const taxValue = {
    branchID: branchID,
    madaRatio: madaRatio.value, // Include current mada ratio value
    madaRatioSum: madaRatioSum.value,
    madaRatioTotal: madaRatioTotal.value,
    madaTax: madaTax.value,
    visaRatio: visaRatio.value,
    visaRatioSum: visaRatioSum.value,
    visaRatioTotal: visaRatioTotal.value,
    visaTax: visaTax.value,
    date: date,
  };

  // Send to taxValue backend
  callUrl(url, method, {
    taxValue: JSON.stringify(taxValue),
  });

  // Send to paymentValue backend
  // If AccountantManager is saving, set approved to true automatically
  // If non-manager is saving, reset approved to false (timer starts)
  const isManager = window.userIsManager === true;
  const isAccountantManager = userRole === "AccountantManager";
  $.ajax({
    url: "/paymentValue",
    type: "POST",
    data: {
      paymentValue: JSON.stringify({
        branchID: branchID,
        date: date,
        paidValues: paidValues,
        receivedValues: receivedValues,
        approved: isAccountantManager ? true : isManager ? undefined : false, // AccountantManager auto-approves
      }),
    },
    success: function (data) {
      // Optionally handle success
    },
    error: function (jqXhr) {
      // Optionally handle error
    },
  });
};

taxButton.addEventListener("click", (e) => {
  // Simply save the data without confirmation dialog
  // Individual field changes will have their own dialogs
  sendTaxRatioData();
});

const sendData = (button) => {
  console.log("=== FRONTEND SENDDATA DEBUG ===");
  console.log("Button clicked:", button);

  let row = button.closest(".d-income-tr");
  console.log("Row element:", row);

  let url = "/dailyIncome";
  let method = "POST";

  let cashValue = $(".cash", row).val();
  let coffeShopValue = $(".coffe-shop", row).val();
  let addedIncomeValue = $(".added-income", row).val();
  let madaValue = $(".mada", row).val();
  let visaValue = $(".visa", row).val();
  let bankTransferValue = $(".bank-transfer", row).val();
  let date = $(".income-date", row).val();
  let branchID = $("#branchID").val();

  const { cash, coffeShop, addedIncome, mada, visa, bankTransfer, arbitrage } =
    validateDailyIncomeInput(
      cashValue,
      coffeShopValue,
      addedIncomeValue,
      madaValue,
      visaValue,
      bankTransferValue
    );

  const requestData = {
    data: JSON.stringify({
      cash,
      coffeShop,
      addedIncome,
      mada,
      visa,
      bankTransfer,
      branchID,
      date,
    }),
  };

  callUrl(url, method, requestData);

  sendTaxRatioData();
};

const calculateMadaTaxes = () => {
  const madaTotal = $(".total-mada").val() || 0;
  const madaRatioValue = madaRatio.value;
  const sum = parseFloat(madaRatioValue * madaTotal).toFixed(2);
  const tax = document.getElementById("mada-tax").value / 100;

  madaRatioSum.value = sum;
  madaRatioTotal.value = parseFloat(tax * sum + +sum).toFixed(2);

  taxRatioTotal.innerHTML = (
    +madaRatioTotal.value + +visaRatioTotal.value
  ).toFixed(2);
};

// Mada ratio change handler - similar to rent change handler in financial.js
$(document).on("change", "#mada-ratio", function () {
  const newMadaRatio = $(this).val();
  const originalMadaRatio = $(this).data("original-value") || newMadaRatio;

  if (!newMadaRatio || isNaN(newMadaRatio)) return;

  // Store original value if not already stored
  if (!$(this).data("original-value")) {
    $(this).data("original-value", originalMadaRatio);
  }

  // Show confirmation dialog for mada ratio change
  swal({
    title: "تغيير نسبة مدى",
    text: "هل أنت متأكد أنك تريد تغيير نسبة مدى لهذا الفرع؟ سيؤثر ذلك على هذا الشهر وكل الشهور القادمة.",
    icon: "warning",
    buttons: {
      confirm: {
        text: "نعم",
        className: "btn btn-success",
      },
      cancel: {
        text: "لا",
        visible: true,
        className: "btn btn-danger",
      },
    },
  }).then((confirmed) => {
    if (confirmed) {
      // Update the original value to the new value
      $(this).data("original-value", newMadaRatio);
      // Recalculate taxes
      calculateMadaTaxes();
    } else {
      // Revert to original value
      $(this).val(originalMadaRatio);
      calculateMadaTaxes();
    }
  });
});

// Store original values when page loads
$(document).ready(function () {
  $("#mada-ratio").each(function () {
    $(this).data("original-value", $(this).val());
  });
  $("#visa-ratio").each(function () {
    $(this).data("original-value", $(this).val());
  });
  $("#mada-tax").each(function () {
    $(this).data("original-value", $(this).val());
  });
  $("#visa-tax").each(function () {
    $(this).data("original-value", $(this).val());
  });
});

// Visa ratio change handler
$(document).on("change", "#visa-ratio", function () {
  const newVisaRatio = $(this).val();
  const originalVisaRatio = $(this).data("original-value") || newVisaRatio;

  if (!newVisaRatio || isNaN(newVisaRatio)) return;

  // Store original value if not already stored
  if (!$(this).data("original-value")) {
    $(this).data("original-value", originalVisaRatio);
  }

  // Show confirmation dialog for visa ratio change
  swal({
    title: "تغيير نسبة البنك للفيزا",
    text: "هل أنت متأكد أنك تريد تغيير نسبة البنك للفيزا لهذا الفرع؟ سيؤثر ذلك على هذا الشهر وكل الشهور القادمة.",
    icon: "warning",
    buttons: {
      confirm: {
        text: "نعم",
        className: "btn btn-success",
      },
      cancel: {
        text: "لا",
        visible: true,
        className: "btn btn-danger",
      },
    },
  }).then((confirmed) => {
    if (confirmed) {
      // Update the original value to the new value
      $(this).data("original-value", newVisaRatio);
      // Recalculate taxes
      calculateVisaTaxes();
    } else {
      // Revert to original value
      $(this).val(originalVisaRatio);
      calculateVisaTaxes();
    }
  });
});

// Mada tax change handler
$(document).on("change", "#mada-tax", function () {
  const newMadaTax = $(this).val();
  const originalMadaTax = $(this).data("original-value") || newMadaTax;

  if (!newMadaTax || isNaN(newMadaTax)) return;

  // Store original value if not already stored
  if (!$(this).data("original-value")) {
    $(this).data("original-value", originalMadaTax);
  }

  // Show confirmation dialog for mada tax change
  swal({
    title: "تغيير قيمة الضريبة (%) للمدى",
    text: "هل أنت متأكد أنك تريد تغيير قيمة الضريبة (%) للمدى لهذا الفرع؟ سيؤثر ذلك على هذا الشهر وكل الشهور القادمة.",
    icon: "warning",
    buttons: {
      confirm: {
        text: "نعم",
        className: "btn btn-success",
      },
      cancel: {
        text: "لا",
        visible: true,
        className: "btn btn-danger",
      },
    },
  }).then((confirmed) => {
    if (confirmed) {
      // Update the original value to the new value
      $(this).data("original-value", newMadaTax);
      // Recalculate taxes
      calculateMadaTaxes();
    } else {
      // Revert to original value
      $(this).val(originalMadaTax);
      calculateMadaTaxes();
    }
  });
});

// Visa tax change handler
$(document).on("change", "#visa-tax", function () {
  const newVisaTax = $(this).val();
  const originalVisaTax = $(this).data("original-value") || newVisaTax;

  if (!newVisaTax || isNaN(newVisaTax)) return;

  // Store original value if not already stored
  if (!$(this).data("original-value")) {
    $(this).data("original-value", originalVisaTax);
  }

  // Show confirmation dialog for visa tax change
  swal({
    title: "تغيير قيمة الضريبة (%) للفيزا",
    text: "هل أنت متأكد أنك تريد تغيير قيمة الضريبة (%) للفيزا لهذا الفرع؟ سيؤثر ذلك على هذا الشهر وكل الشهور القادمة.",
    icon: "warning",
    buttons: {
      confirm: {
        text: "نعم",
        className: "btn btn-success",
      },
      cancel: {
        text: "لا",
        visible: true,
        className: "btn btn-danger",
      },
    },
  }).then((confirmed) => {
    if (confirmed) {
      // Update the original value to the new value
      $(this).data("original-value", newVisaTax);
      // Recalculate taxes
      calculateVisaTaxes();
    } else {
      // Revert to original value
      $(this).val(originalVisaTax);
      calculateVisaTaxes();
    }
  });
});

const calculateVisaTaxes = () => {
  const visaTotal = $(".total-visa").val() || 0;
  const visaRatioValue = visaRatio.value / 100;
  const sum = parseFloat(visaRatioValue * visaTotal).toFixed(2);
  const tax = document.getElementById("visa-tax").value / 100;

  visaRatioSum.value = sum;
  visaRatioTotal.value = parseFloat(tax * sum + +sum).toFixed(2);

  taxRatioTotal.innerHTML = (
    +madaRatioTotal.value + +visaRatioTotal.value
  ).toFixed(2);
};

const submitSearchForm = function () {
  let form = document.getElementById("search-form");
  let month = document.getElementById("month").value;
  let branch = document.getElementById("branchID").value;

  if (month && branch) {
    form.submit();
  }
};

function callUrl(url, method, data) {
  $.ajax({
    url,
    type: method,
    data: data,
    success: (data, status, xhr) => {
      swal({
        title: data.message,
        type: "success",
        buttons: {
          confirm: {
            className: "btn btn-success",
          },
        },
      }).then((OK) => {
        if (OK) {
          $(window).scrollTop(0);
          location.reload();
        }
      });
    },
    error: (jqXhr, textStatus, errorMessage) => {
      swal("حدث خطأ", jqXhr.responseJSON.errorMessage, {
        icon: "error",
        buttons: {
          confirm: {
            className: "btn btn-danger",
          },
        },
      }).then((OK) => {
        if (OK) {
          swal.close();
        }
      });
    },
  });
}

Date.prototype.toDateInputValue = function () {
  let local = new Date(this);
  local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
  return local.toJSON().slice(0, 7);
};

const validateDailyIncomeInput = (
  cash,
  coffeShop,
  addedIncome,
  mada,
  visa,
  bankTransfer
) => {
  if (!cash || isNaN(cash)) {
    cash = parseFloat(0).toFixed(2);
  } else {
    cash = parseFloat(cash).toFixed(2);
  }

  if (!coffeShop || isNaN(coffeShop)) {
    coffeShop = parseFloat(0).toFixed(2);
  } else {
    coffeShop = parseFloat(coffeShop).toFixed(2);
  }

  if (!addedIncome || isNaN(addedIncome)) {
    addedIncome = parseFloat(0).toFixed(2);
  } else {
    addedIncome = parseFloat(addedIncome).toFixed(2);
  }

  if (!mada || isNaN(mada)) {
    mada = parseFloat(0).toFixed(2);
  } else {
    mada = parseFloat(mada).toFixed(2);
  }

  if (!visa || isNaN(visa)) {
    visa = parseFloat(0).toFixed(2);
  } else {
    visa = parseFloat(visa).toFixed(2);
  }

  if (!bankTransfer || isNaN(bankTransfer)) {
    bankTransfer = parseFloat(0).toFixed(2);
  } else {
    bankTransfer = parseFloat(bankTransfer).toFixed(2);
  }

  return {
    cash,
    coffeShop,
    addedIncome,
    mada,
    visa,
    bankTransfer,
  };
};

const validateInputValue = (value) => {
  if (!value || isNaN(value)) {
    return 0;
  } else {
    return value;
  }
};

const calculateColumnsTotal = () => {
  let totalCash = 0;
  let totalCoffeeShop = 0;
  let totalAddedIncome = 0;
  let totalMada = 0;
  let totalVisa = 0;
  let totalBankTransfer = 0;
  let totalArbitrage = 0;
  let totalDailyTotal = 0;

  $("tr .cash").each(function (index, value) {
    let currentValue = parseFloat($(this).val());
    currentValue = validateInputValue(currentValue);
    totalCash += currentValue;
  });

  $("tr .coffe-shop").each(function (index, value) {
    let currentValue = parseFloat($(this).val());
    currentValue = validateInputValue(currentValue);
    totalCoffeeShop += currentValue;
  });

  $("tr .added-income").each(function (index, value) {
    let currentValue = parseFloat($(this).val());
    currentValue = validateInputValue(currentValue);
    totalAddedIncome += currentValue;
  });

  $("tr .mada").each(function (index, value) {
    let currentValue = parseFloat($(this).val());
    currentValue = validateInputValue(currentValue);
    totalMada += currentValue;
  });

  $("tr .visa").each(function (index, value) {
    let currentValue = parseFloat($(this).val());
    currentValue = validateInputValue(currentValue);
    totalVisa += currentValue;
  });

  $("tr .bank-transfer").each(function (index, value) {
    let currentValue = parseFloat($(this).val());
    currentValue = validateInputValue(currentValue);
    totalBankTransfer += currentValue;
  });

  $("tr .arbitrage").each(function (index, value) {
    let currentValue = parseFloat($(this).val());
    currentValue = validateInputValue(currentValue);
    totalArbitrage += currentValue;
  });

  $("tr .daily-total").each(function (index, value) {
    let currentValue = parseFloat($(this).val());
    currentValue = validateInputValue(currentValue);
    totalDailyTotal += currentValue;
  });

  $(".total-cash").val(parseFloat(totalCash).toFixed(2));
  $(".total-coffe-shop").val(parseFloat(totalCoffeeShop).toFixed(2));
  $(".total-added-income").val(parseFloat(totalAddedIncome).toFixed(2));
  $(".total-mada").val(parseFloat(totalMada).toFixed(2));
  $(".total-visa").val(parseFloat(totalVisa).toFixed(2));
  $(".total-bank-transfer").val(parseFloat(totalBankTransfer).toFixed(2));
  $(".total-arbitrage").val(parseFloat(totalArbitrage).toFixed(2));
  $(".total-daily-total").val(parseFloat(totalDailyTotal).toFixed(2));
};

calculateMadaTaxes();
calculateVisaTaxes();

$("#daily-income-table").delegate("input", "keyup", "change", function (e) {
  let row = $(this).closest("tr");

  let cashValue = $(".cash", row).val();
  let coffeShopValue = $(".coffe-shop", row).val();
  let addedIncomeValue = $(".added-income", row).val();
  let madaValue = $(".mada", row).val();
  let visaValue = $(".visa", row).val();
  let bankTransferValue = $(".bank-transfer", row).val();

  const { cash, coffeShop, addedIncome, mada, visa, bankTransfer } =
    validateDailyIncomeInput(
      cashValue,
      coffeShopValue,
      addedIncomeValue,
      madaValue,
      visaValue,
      bankTransferValue
    );

  let dailyTotal = (
    parseFloat(cash) +
    parseFloat(coffeShop) +
    parseFloat(addedIncome) +
    parseFloat(mada) +
    parseFloat(visa) -
    parseFloat(bankTransfer)
  ).toFixed(2);

  let arbitrage = (parseFloat(mada) + parseFloat(visa)).toFixed(2);

  $(".daily-total", row).val(dailyTotal);
  $(".arbitrage", row).val(arbitrage);

  calculateColumnsTotal();

  calculateMadaTaxes();
  calculateVisaTaxes();
});

if (document.getElementById("month")) {
  if (!document.getElementById("month").value) {
    document.getElementById("month").value = moment().format("YYYY/MM");
  }
}

let originalMadaRatio = madaRatio.value;

madaRatio.addEventListener("focus", function () {
  originalMadaRatio = madaRatio.value;
});

madaRatio.addEventListener("change", function (e) {
  const newValue = madaRatio.value;
  swal({
    title: "تغيير نسبة مدى",
    text: "هل أنت متأكد أنك تريد تغيير نسبة مدى لهذا الشهر؟ سيؤثر ذلك على هذا الشهر وكل الشهور القادمة.",
    icon: "warning",
    buttons: {
      confirm: {
        text: "نعم",
        className: "btn btn-success",
      },
      cancel: {
        text: "لا",
        visible: true,
        className: "btn btn-danger",
      },
    },
  }).then((confirmed) => {
    if (confirmed) {
      // Keep the new value and enable save
      calculateMadaTaxes();
    } else {
      // Revert to original value
      madaRatio.value = originalMadaRatio;
      calculateMadaTaxes();
    }
  });
});

// These event listeners are now handled by the jQuery change handlers above
// which include confirmation dialogs

// Live sum for Paid Amount
$(document).on("input", ".paid-field", function () {
  let total = 0;
  $(".paid-field").each(function () {
    let val = parseFloat($(this).val());
    if (!isNaN(val)) total += val;
  });
  $("#paid-total").val(total.toFixed(2));
});
// Live sum for Received Amount
$(document).on("input", ".received-field", function () {
  let total = 0;
  $(".received-field").each(function () {
    let val = parseFloat($(this).val());
    if (!isNaN(val)) total += val;
  });
  $("#received-total").val(total.toFixed(2));
});

function updateGrandTotal() {
  let total = 0;
  $(".paid-field, .received-field").each(function () {
    let val = parseFloat($(this).val());
    if (!isNaN(val)) total += val;
  });
  $("#grand-total").val(total.toFixed(2));
}

$(document).on("input", ".paid-field, .received-field", function () {
  updateGrandTotal();
});

// Notes functionality
let addNoteButton = document.getElementById("add-note-button");
if (addNoteButton) {
  addNoteButton.addEventListener("click", addNote);
}

function addNote(event) {
  event.preventDefault();
  let wrapper = $("#notes-body");
  let input = null;
  input =
    '<div class="row form-group">' +
    '<div class="col-6">' +
    ' <input type="text" class="form-control text-right note-input" placeholder="أكتب ملاحظة"> ' +
    "</div>" +
    '<div class="col-6">' +
    '<input type="text" class="form-control text-right note-input" placeholder="أكتب ملاحظة">' +
    "</div></div>";
  $(wrapper).append(input);
}

const saveNotes = (event) => {
  event.preventDefault();

  let url = "/dailyIncome/notes";
  let notes = [];
  let method = "POST";
  let date = $("#month").val();
  let branchID = $("#branchID").val();

  let notesElements = document.getElementsByClassName("note-input");
  for (let i = 0; i < notesElements.length; i++) {
    // Send all notes (including empty ones) so backend can handle deletion
    notes.push({
      branchID: branchID,
      note: notesElements[i].value || "",
      date,
    });
  }

  callUrl(url, method, {
    notes: JSON.stringify(notes),
  });
};

// Track last submitted values per field
let lastSubmittedValues = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
let fieldStatuses = [
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
];
let isCurrentMonth = true;

// Function to update field status and styling
function updateFieldStatus(fieldIndex, status) {
  const field = $(`.paid-field[data-field-index="${fieldIndex}"]`);
  field.removeClass("status-approved status-rejected status-pending");

  if (status === "approved") {
    field.addClass("status-approved");
    if (!window.userIsManager) {
      field.prop("disabled", true);
    }
  } else if (status === "rejected") {
    field.addClass("status-rejected");
    // Don't disable rejected fields - keep them editable
    // When resubmitted, they will become pending (yellow)
  } else if (status === "pending") {
    field.addClass("status-pending");
    // Show approve/reject buttons for managers if pending
    if (window.userIsManager) {
      $(`#field-buttons-${fieldIndex}`).addClass("show");
    }
  } else {
    field.removeClass("status-approved status-rejected status-pending");
    if (window.userIsManager) {
      $(`#field-buttons-${fieldIndex}`).removeClass("show");
    }
  }
}

// Function to check if field value changed
function checkFieldChange(fieldIndex, currentValue) {
  const lastSubmitted = lastSubmittedValues[fieldIndex] || 0;

  // Compare with tolerance for floating point
  const hasChanged = Math.abs(currentValue - lastSubmitted) > 0.01;

  if (hasChanged && currentValue !== 0) {
    // Field changed and has a non-zero value compared to last submitted
    // If field was rejected, it will become pending when resubmitted
    if (fieldStatuses[fieldIndex] === "rejected") {
      // When resubmitting after rejection, it should become pending (will be set on save)
      // Show buttons for managers
      if (window.userIsManager) {
        $(`#field-buttons-${fieldIndex}`).addClass("show");
      }
    } else if (
      fieldStatuses[fieldIndex] === "pending" ||
      fieldStatuses[fieldIndex] === null
    ) {
      // Show buttons for pending or null fields that have changed
      if (window.userIsManager) {
        $(`#field-buttons-${fieldIndex}`).addClass("show");
      }
    }
  } else {
    // Field value matches last submitted or is 0 - hide buttons if status is not pending
    if (fieldStatuses[fieldIndex] !== "pending") {
      $(`#field-buttons-${fieldIndex}`).removeClass("show");
    }
  }
}

$(document).ready(function () {
  let date = $("#month").val();
  let branchID = $("#branchID").val();
  if (!branchID) return; // Don't fetch if branchID is not selected

  // Check if current month
  if (date) {
    const normalizedMonth = date.replace(/\//g, "-");
    const selectedDate = new Date(normalizedMonth + "-01");
    const currentDate = new Date();
    const selectedMonth = selectedDate.getMonth();
    const selectedYear = selectedDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    isCurrentMonth =
      selectedYear === currentYear && selectedMonth === currentMonth;
  }

  $.ajax({
    url: "/paymentValue",
    type: "GET",
    data: { branchID: branchID, date: date },
    success: function (data) {
      // Store last submitted values and statuses
      if (
        data &&
        data.lastSubmittedPaidValues &&
        Array.isArray(data.lastSubmittedPaidValues)
      ) {
        lastSubmittedValues = [...data.lastSubmittedPaidValues];
        while (lastSubmittedValues.length < 15) {
          lastSubmittedValues.push(0);
        }
        lastSubmittedValues = lastSubmittedValues.slice(0, 15);
      }

      if (
        data &&
        data.paidFieldStatuses &&
        Array.isArray(data.paidFieldStatuses)
      ) {
        fieldStatuses = [...data.paidFieldStatuses];
        while (fieldStatuses.length < 15) {
          fieldStatuses.push(null);
        }
        fieldStatuses = fieldStatuses.slice(0, 15);
      }

      if (data && data.paidValues && Array.isArray(data.paidValues)) {
        $(".paid-field").each(function (i) {
          const fieldIndex = parseInt($(this).attr("data-field-index"));
          const value =
            data.paidValues[fieldIndex] !== undefined
              ? data.paidValues[fieldIndex]
              : 0;
          $(this).val(value);

          // For non-managers: Disable ALL fields if month doesn't match (highest priority)
          if (!window.userIsManager && !isCurrentMonth) {
            $(this).prop("disabled", true);
            return; // Skip the rest of the logic for non-current months
          }

          // Apply status styling
          if (fieldStatuses[fieldIndex]) {
            updateFieldStatus(fieldIndex, fieldStatuses[fieldIndex]);
          } else {
            // Check if field has changed compared to last submitted (for showing buttons)
            const lastSubmitted = lastSubmittedValues[fieldIndex] || 0;
            const hasChanged = Math.abs(value - lastSubmitted) > 0.01;

            if (hasChanged && window.userIsManager) {
              // Show buttons for changed fields
              $(`#field-buttons-${fieldIndex}`).addClass("show");
            }
          }

          // For non-managers in current month: disable approved fields only
          if (
            !window.userIsManager &&
            fieldStatuses[fieldIndex] === "approved"
          ) {
            $(this).prop("disabled", true);
          }
          // Rejected fields remain editable - they show red border until resubmitted
        });
      }

      if (data && data.receivedValues && Array.isArray(data.receivedValues)) {
        $(".received-field").each(function (i) {
          $(this).val(
            data.receivedValues[i] !== undefined ? data.receivedValues[i] : 0
          );
        });
      }

      updateGrandTotal();
    },
  });

  // Track field changes for showing approve/reject buttons
  $(document).on("input change", ".paid-field", function () {
    // For non-managers: prevent changes if not current month
    if (!window.userIsManager && !isCurrentMonth) {
      $(this).prop("disabled", true);
      return;
    }

    if (!window.userIsManager) return; // Only managers can trigger approve/reject buttons

    const fieldIndex = parseInt($(this).attr("data-field-index"));
    const currentValue = parseFloat($(this).val()) || 0;

    checkFieldChange(fieldIndex, currentValue);
  });

  // Scroll to last edited non-zero row
  scrollToLastEditedNonZeroRow();

  // Add event listener for save notes button
  let saveNotesButton = document.getElementById("save-notes-button");
  if (saveNotesButton) {
    saveNotesButton.addEventListener("click", saveNotes);
  }

  // Add event listeners for per-field approve/reject buttons
  $(document).on("click", ".approve-field-btn", function () {
    const fieldIndex = parseInt($(this).attr("data-field-index"));
    approvePaymentField(fieldIndex);
  });

  $(document).on("click", ".reject-field-btn", function () {
    const fieldIndex = parseInt($(this).attr("data-field-index"));
    rejectPaymentField(fieldIndex);
  });

  // Add event listener for save paid values button (non-managers only)
  let savePaidValuesButton = document.getElementById("save-paid-values-button");
  if (savePaidValuesButton) {
    savePaidValuesButton.addEventListener("click", function () {
      savePaidValuesOnly();
    });
  }
});

// Function to approve a specific field
function approvePaymentField(fieldIndex) {
  swal({
    title: "قبول القيم",
    text: `هل أنت متأكد أنك تريد قبول مبلغ محول ${fieldIndex + 1}؟`,
    icon: "warning",
    buttons: {
      confirm: {
        text: "نعم",
        className: "btn btn-success",
      },
      cancel: {
        text: "لا",
        visible: true,
        className: "btn btn-danger",
      },
    },
  }).then((confirmed) => {
    if (confirmed) {
      let date = $("#month").val();
      let branchID = $("#branchID").val();

      $.ajax({
        url: "/paymentValue/approve-field",
        type: "POST",
        data: {
          branchID: branchID,
          date: date,
          fieldIndex: fieldIndex,
        },
        success: function (data) {
          fieldStatuses[fieldIndex] = "approved";
          updateFieldStatus(fieldIndex, "approved");
          $(`#field-buttons-${fieldIndex}`).removeClass("show");

          swal({
            title: data.message,
            type: "success",
            buttons: {
              confirm: {
                className: "btn btn-success",
              },
            },
          });
        },
        error: function (jqXhr) {
          swal(
            "حدث خطأ",
            jqXhr.responseJSON?.errorMessage || "فشل في قبول القيم",
            {
              icon: "error",
              buttons: {
                confirm: {
                  className: "btn btn-danger",
                },
              },
            }
          );
        },
      });
    } else {
      // If "لا" (No) is clicked, immediately reject the field without confirmation
      let date = $("#month").val();
      let branchID = $("#branchID").val();

      $.ajax({
        url: "/paymentValue/reject-field",
        type: "POST",
        data: {
          branchID: branchID,
          date: date,
          fieldIndex: fieldIndex,
        },
        success: function (data) {
          // Update field to 0 and show red border, keep it editable
          const field = $(`.paid-field[data-field-index="${fieldIndex}"]`);
          field.val(0);
          fieldStatuses[fieldIndex] = "rejected";
          updateFieldStatus(fieldIndex, "rejected");
          $(`#field-buttons-${fieldIndex}`).removeClass("show");

          swal({
            title: data.message,
            type: "success",
            buttons: {
              confirm: {
                className: "btn btn-success",
              },
            },
          });
        },
        error: function (jqXhr) {
          swal(
            "حدث خطأ",
            jqXhr.responseJSON?.errorMessage || "فشل في رفض القيم",
            {
              icon: "error",
              buttons: {
                confirm: {
                  className: "btn btn-danger",
                },
              },
            }
          );
        },
      });
    }
  });
}

// Function to reject a specific field
function rejectPaymentField(fieldIndex) {
  swal({
    title: "رفض القيم",
    text: `هل أنت متأكد أنك تريد رفض مبلغ محول ${fieldIndex + 1}؟`,
    icon: "warning",
    buttons: {
      confirm: {
        text: "نعم",
        className: "btn btn-danger",
      },
      cancel: {
        text: "لا",
        visible: true,
        className: "btn btn-light",
      },
    },
  }).then((confirmed) => {
    if (confirmed) {
      let date = $("#month").val();
      let branchID = $("#branchID").val();

      $.ajax({
        url: "/paymentValue/reject-field",
        type: "POST",
        data: {
          branchID: branchID,
          date: date,
          fieldIndex: fieldIndex,
        },
        success: function (data) {
          // Update field to 0 and show red border, keep it editable
          const field = $(`.paid-field[data-field-index="${fieldIndex}"]`);
          field.val(0);
          fieldStatuses[fieldIndex] = "rejected";
          updateFieldStatus(fieldIndex, "rejected");
          $(`#field-buttons-${fieldIndex}`).removeClass("show");

          swal({
            title: data.message,
            type: "success",
            buttons: {
              confirm: {
                className: "btn btn-success",
              },
            },
          });
        },
        error: function (jqXhr) {
          swal(
            "حدث خطأ",
            jqXhr.responseJSON?.errorMessage || "فشل في رفض القيم",
            {
              icon: "error",
              buttons: {
                confirm: {
                  className: "btn btn-danger",
                },
              },
            }
          );
        },
      });
    }
  });
}

// Function to save only paid values (for non-managers when حفظ النسبة is disabled)
function savePaidValuesOnly() {
  let date = $("#month").val();
  let branchID = $("#branchID").val();

  // Collect paid and received values
  const paidValues = [];
  $(".paid-field").each(function () {
    let val = parseFloat($(this).val());
    paidValues.push(isNaN(val) ? 0 : val);
  });

  // Ensure we have exactly 10 paid values
  while (paidValues.length < 10) {
    paidValues.push(0);
  }

  const receivedValues = [];
  $(".received-field").each(function () {
    let val = parseFloat($(this).val());
    receivedValues.push(isNaN(val) ? 0 : val);
  });

  // Ensure we have exactly 10 received values
  while (receivedValues.length < 10) {
    receivedValues.push(0);
  }

  // Only save paid values
  // If AccountantManager is saving, set approved to true automatically
  // Otherwise, reset approved to false (timer starts)
  const isAccountantManager = userRole === "AccountantManager";
  $.ajax({
    url: "/paymentValue",
    type: "POST",
    data: {
      paymentValue: JSON.stringify({
        branchID: branchID,
        date: date,
        paidValues: paidValues,
        receivedValues: receivedValues,
        approved: isAccountantManager ? true : false, // AccountantManager auto-approves
      }),
    },
    success: function (data) {
      swal({
        title: "تم الحفظ",
        text: "تم حفظ المبلغ المحول بنجاح",
        type: "success",
        buttons: {
          confirm: {
            className: "btn btn-success",
          },
        },
      }).then(() => {
        // After saving, if not current month, disable all fields for non-managers
        if (!window.userIsManager && !isCurrentMonth) {
          $(".paid-field").prop("disabled", true);
        }
        location.reload();
      });
    },
    error: function (jqXhr) {
      swal(
        "حدث خطأ",
        jqXhr.responseJSON?.errorMessage || "فشل في حفظ المبلغ المحول",
        {
          icon: "error",
          buttons: {
            confirm: {
              className: "btn btn-danger",
            },
          },
        }
      );
    },
  });
}

// Function to scroll to the last edited non-zero row
function scrollToLastEditedNonZeroRow() {
  let lastEditedRow = null;
  let lastEditedIndex = -1;

  // Find all daily income rows (excluding the totals row)
  $(".d-income-tr").each(function (index) {
    let row = $(this);

    // Skip the totals row (it doesn't have the same structure)
    if (row.find(".income-date").length === 0) {
      return;
    }

    // Check if this row has been edited (has data)
    let cash = parseFloat(row.find(".cash").val()) || 0;
    let coffeeShop = parseFloat(row.find(".coffe-shop").val()) || 0;
    let addedIncome = parseFloat(row.find(".added-income").val()) || 0;
    let mada = parseFloat(row.find(".mada").val()) || 0;
    let visa = parseFloat(row.find(".visa").val()) || 0;
    let bankTransfer = parseFloat(row.find(".bank-transfer").val()) || 0;

    // Check if any field has a non-zero value
    let hasNonZeroValue =
      cash > 0 ||
      coffeeShop > 0 ||
      addedIncome > 0 ||
      mada > 0 ||
      visa > 0 ||
      bankTransfer > 0;

    if (hasNonZeroValue) {
      lastEditedRow = row;
      lastEditedIndex = index;
    }
  });

  // If we found a last edited row, scroll to it
  if (lastEditedRow && lastEditedIndex >= 0) {
    // Add a small delay to ensure the page is fully loaded
    setTimeout(function () {
      // Get the table container
      let tableContainer = $(".table-responsive");

      // Calculate the position to scroll to
      let rowTop = lastEditedRow.offset().top;
      let containerTop = tableContainer.offset().top;
      let scrollPosition = rowTop - containerTop - 100; // 100px offset for better visibility

      // Scroll the table container to the row
      tableContainer.scrollTop(scrollPosition);

      // Highlight the row briefly to draw attention
      lastEditedRow.addClass("highlight-row");
      setTimeout(function () {
        lastEditedRow.removeClass("highlight-row");
      }, 2000);
    }, 500);
  }
}
