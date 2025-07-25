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
  const receivedValues = [];
  $(".received-field").each(function () {
    let val = parseFloat($(this).val());
    receivedValues.push(isNaN(val) ? 0 : val);
  });

  const taxValue = {
    branchID: branchID,
    madaRatio: madaRatio.value,
    madaRatioSum: madaRatioSum.value,
    madaRatioTotal: madaRatioTotal.value,
    madaTax: madaTax.value,
    visaRatio: visaRatio.value,
    visaRatioSum: visaRatioSum.value,
    visaRatioTotal: visaRatioTotal.value,
    visaTax: visaTax.value,
    date: date,
    paidValues: paidValues,
    receivedValues: receivedValues,
  };

  callUrl(url, method, {
    taxValue: JSON.stringify(taxValue),
  });
};

taxButton.addEventListener("click", (e) => {
  sendTaxRatioData();
});

const sendData = (button) => {
  let row = button.closest(".d-income-tr");
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

  callUrl(url, method, {
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
  });

  sendTaxRatioData();
};

const calculateMadaTaxes = () => {
  const madaTotal = $(".total-mada").val() || 0;
  const madaRatioValue = madaRatio.value;
  const sum = parseFloat(madaRatioValue * madaTotal).toFixed(2);
  const tax = document.getElementById("mada-tax").value / 100;

  madaRatioSum.value = sum;
  madaRatioTotal.value = parseFloat(tax * sum + +sum).toFixed(2);

  taxRatioTotal.innerHTML = +madaRatioTotal.value + +visaRatioTotal.value;
};

const calculateVisaTaxes = () => {
  const visaTotal = $(".total-visa").val() || 0;
  const visaRatioValue = visaRatio.value / 100;
  const sum = parseFloat(visaRatioValue * visaTotal).toFixed(2);
  const tax = document.getElementById("visa-tax").value / 100;

  visaRatioSum.value = sum;
  visaRatioTotal.value = parseFloat(tax * sum + +sum).toFixed(2);

  taxRatioTotal.innerHTML = +madaRatioTotal.value + +visaRatioTotal.value;
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

visaRatio.addEventListener("change", (e) => {
  calculateVisaTaxes();
});

madaTax.addEventListener("change", (e) => {
  calculateMadaTaxes();
});

visaTax.addEventListener("change", (e) => {
  calculateVisaTaxes();
});

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

$(document).ready(function () {
  // Populate paid and received fields from backend if present
  if (typeof taxValue !== "undefined") {
    if (taxValue.paidValues && Array.isArray(taxValue.paidValues)) {
      $(".paid-field").each(function (i) {
        $(this).val(
          taxValue.paidValues[i] !== undefined ? taxValue.paidValues[i] : 0
        );
      });
      // Trigger total calculation
      $(".paid-field").first().trigger("input");
    }
    if (taxValue.receivedValues && Array.isArray(taxValue.receivedValues)) {
      $(".received-field").each(function (i) {
        $(this).val(
          taxValue.receivedValues[i] !== undefined
            ? taxValue.receivedValues[i]
            : 0
        );
      });
      // Trigger total calculation
      $(".received-field").first().trigger("input");
    }
  }
});
