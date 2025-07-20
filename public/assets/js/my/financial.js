Date.prototype.toDateInputValue = function () {
  let local = new Date(this);
  local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
  return local.toJSON().slice(0, 7);
};

let date = document.getElementById("query-date");
if (date) {
  if (!date.value) {
    date.value = new Date().toDateInputValue();
  }
}

let dailyNetIncome = document.getElementById("daily-net-income");
let dailyNetIncomePrint = document.getElementById("total-net-income-print");

if (dailyNetIncome) {
  let totalNetIncome = parseFloat(
    document.getElementById("total-net-income").innerHTML
  );
  dailyNetIncome.innerHTML = (totalNetIncome / 30).toFixed(2);
  dailyNetIncomePrint.innerHTML = (totalNetIncome / 30).toFixed(2);
}

let partnersValue = document.getElementById("partners-value");
let partnersCount = document.getElementById("partners-count");

let printPartnersCount = document.getElementById("print-partners-count");
let printPartnersValue = document.getElementById("print-partners-value");

const calculatePartnersValue = function () {
  if (partnersValue) {
    printPartnersCount.value = parseInt(partnersCount.value);
    let partnersCountValue = parseInt(partnersCount.value);
    let totalNetIncome = numeral(
      document.getElementById("total-net-income").innerHTML
    ).value();

    if (!partnersCountValue) {
      partnersValue.value = totalNetIncome;
      printPartnersValue.value = numeral(totalNetIncome).format('0,0.00');
    } else { 
      partnersValue.value = (totalNetIncome / partnersCountValue).toFixed(2);
      printPartnersValue.value = numeral(partnersValue.value).format('0,0.00');
    }
  }
};

calculatePartnersValue();

if (partnersCount) {
  partnersCount.addEventListener("input", calculatePartnersValue);
}

$(".edit-button").on("click", function () {
  let tr = $(this).closest("tr");
  let branchID = $(".branch-id", tr).text();
  let date = $("#query-date").val();

  $("#editFinancialModal").on("show.bs.modal", function (event) {
    let modal = $(this);

    let income = $(".income", tr).text();
    let rent = $(".rent", tr).text();
    let expenses = $(".expenses", tr).text();
    let bankRatio = $(".bank-ratio", tr).text();
    let salaries = $(".salaries", tr).text();
    let saudizationSalary = $(".saudization-salary", tr).text();
    let bills = $(".bills", tr).text();
    let bills1 = $(".bills1", tr).text();
    let bills2 = $(".bills2", tr).text();
    let netIncome = $(".net-income", tr).text();

    modal.find(".modal-body #modal-income").val(income);
    modal.find(".modal-body #modal-rent").val(rent);
    modal.find(".modal-body #modal-expenses").val(expenses);
    modal.find(".modal-body #modal-bank-ratio").val(bankRatio);
    modal.find(".modal-body #modal-salaries").val(salaries);
    modal.find(".modal-body #modal-saudization-salary").val(saudizationSalary);
    modal.find(".modal-body #modal-bills").val(bills);
    modal.find(".modal-body #modal-bills1").val(bills1);
    modal.find(".modal-body #modal-bills2").val(bills2);
    modal.find(".modal-body #modal-net-income").val(netIncome);
    modal.find(".modal-body #modal-branch-id").text(branchID);
    modal.find(".modal-body #modal-date").text(date);
  });
});

const postFinancial = (event) => {
  event.preventDefault();

  let url = "/financial";
  let method = "PATCH";
  let data = {
    income: $("#modal-income").val() || 0,
    rent: $("#modal-rent").val() || 0,
    expenses: $("#modal-expenses").val() || 0,
    bankRatio: $("#modal-bank-ratio").val() || 0,
    salaries: $("#modal-salaries").val() || 0,
    saudizationSalary: $("#modal-saudization-salary").val() || 0,
    bills: $("#modal-bills").val() || 0,
    bills1: $("#modal-bills1").val() || 0,
    bills2: $("#modal-bills2").val() || 0,
    branchID: $("#modal-branch-id").text(),
    date: $("#modal-date").text(),
  };

  callUrl(url, method, data);
};

const postFinancialComments = (event) => {
  event.preventDefault();

  let url = "/financial/comments";
  let method = "PATCH";
  let data = {
    financialComment: $("#modal-financial-comment").val() || null,
    rentComment: $("#modal-rent-comment").val() || null,
    branchID: $("#modal-branch-id").text(),
    date: $("#modal-date").text(),
  };

  callUrl(url, method, data);
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

const form = document.getElementById("modalFinancialForm");
if (form) {
  form.addEventListener("submit", postFinancial);
}

const commentsForm = document.getElementById("modalFinancialCommentsForm");
if (commentsForm) {
  commentsForm.addEventListener("submit", postFinancialComments);
}

$("#modalFinancialForm").delegate("input", "keyup", "change", function (e) {
  let income = $("#modal-income").val() || 0;
  let rent = $("#modal-rent").val() || 0;
  let expenses = $("#modal-expenses").val() || 0;
  let bankRatio = $("#modal-bank-ratio").val() || 0;
  let salaries = $("#modal-salaries").val() || 0;
  let saudizationSalary = $("#modal-saudization-salary").val() || 0;
  let bills = $("#modal-bills").val() || 0;
  let bills1 = $("#modal-bills1").val() || 0;
  let bills2 = $("#modal-bills2").val() || 0;

  let netIcome = (
    parseFloat(income) -
    parseFloat(rent) -
    parseFloat(expenses) -
    parseFloat(bankRatio) -
    parseFloat(salaries) -
    parseFloat(saudizationSalary) -
    parseFloat(bills) -
    parseFloat(bills1) -
    parseFloat(bills2)
  ).toFixed(2);

  netIcome = getNumberWithCommas(netIcome)
  $("#modal-net-income").val(netIcome);
});

$(".comments-edit-button").on("click", function () {
  let tr = $(this).closest("tr");
  let branchID = $(".branch-id", tr).text();
  let date = $("#query-date").val();

  $("#financialCommentsModal").on("show.bs.modal", function (event) {
    let modal = $(this);

    let financialComment = $(".financial-comment", tr).text();
    let rentComment = $(".rent-comment", tr).text();

    modal.find(".modal-body #modal-financial-comment").val(financialComment);
    modal.find(".modal-body #modal-rent-comment").val(rentComment);
    modal.find(".modal-body #modal-branch-id").text(branchID);
    modal.find(".modal-body #modal-date").text(date);
  });
});

const sendData = async () => {
  let url = "/financial/add";
  let method = "POST";
  let data = [];
  let notes = [];

  let date = $("#query-date").val();
  let table = document.getElementById("add-financial-table");

  for (let i = 0, row; (row = table.rows[i]); i++) {
    let branchData = {};
    let branchID = $(".branch-id", row).text();
    if (branchID) {
      branchData.branchID = branchID;
      branchData.income = numeral($(".income", row).val()).value();
      branchData.expenses = numeral($(".expenses", row).val()).value();
      branchData.rent = $(".rent", row).val();
      branchData.bankRatio = $(".bank-ratio", row).val();
      branchData.salaries = numeral($(".salaries", row).val()).value();
      branchData.saudizationSalary = $(".saudization-salary", row).val();
      branchData.bills = $(".bills", row).val();
      branchData.bills1 = $(".bills1", row).val();
      branchData.bills2 = $(".bills2", row).val();
      branchData.netIcome = numeral($(".net-income", row).val()).value();

      data.push(branchData);
    }
  }

  let notesElements = document.getElementsByClassName("note-input");
  for (let i = 0; i < notesElements.length; i++) {
    if (!notesElements[i].value) {
      continue;
    }

    notes.push({
      note: notesElements[i].value,
      date,
    });
  }

  let rentNotesElements = document.getElementsByClassName("rent-note-input");
  let rentBranchIDs = document.getElementsByClassName("rent-branch-id");

  let rentNotes = [];
  for (let i = 0; i < rentNotesElements.length; i++) {
    if (!rentNotesElements[i].value) {
      rentNotesElements[i].value = "";
    }

    rentNotes.push({
      branchID: rentBranchIDs[i].innerHTML,
      note: rentNotesElements[i].value,
      date,
    });
  }

  let partnersCount = $("#partners-count").val();
  callUrl(url, method, {
    data: JSON.stringify(data),
    partnersCount,
    date,
    notes: JSON.stringify(notes),
    rentNotes: JSON.stringify(rentNotes),
  });
};

let button = document.getElementById("submit-button");
if (button) {
  button.addEventListener("click", sendData);
}

const addNote = (event) => {
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
};

let addNoteButton = document.getElementById("add-note-button");
if (addNoteButton) {
  addNoteButton.addEventListener("click", addNote);
}

const validateFinancialInput = (
  income,
  rent,
  expenses,
  bankRatio,
  salaries,
  saudizationSalary,
  bills,
  bills1,
  bills2
) => {
  if (!income || isNaN(income)) {
    income = "0";
  } else {
    income = parseFloat(income).toFixed(2);
  }

  if (!rent || isNaN(rent)) {
    rent = "0";
  } else {
    rent = parseFloat(rent).toFixed(2);
  }

  if (!expenses || isNaN(expenses)) {
    expenses = "0";
  } else {
    expenses = parseFloat(expenses).toFixed(2);
  }

  if (!bankRatio || isNaN(bankRatio)) {
    bankRatio = "0";
  } else {
    bankRatio = parseFloat(bankRatio).toFixed(2);
  }

  if (!salaries || isNaN(salaries)) {
    salaries = "0";
  } else {
    salaries = parseFloat(salaries).toFixed(2);
  }

  if (!saudizationSalary || isNaN(saudizationSalary)) {
    saudizationSalary = "0";
  } else {
    saudizationSalary = parseFloat(saudizationSalary).toFixed(2);
  }

  if (!bills || isNaN(bills)) {
    bills = "0";
  } else {
    bills = parseFloat(bills).toFixed(2);
  }

  if (!bills1 || isNaN(bills1)) {
    bills1 = "0";
  } else {
    bills1 = parseFloat(bills1).toFixed(2);
  }

  if (!bills2 || isNaN(bills2)) {
    bills2 = "0";
  } else {
    bills2 = parseFloat(bills2).toFixed(2);
  }

  return {
    income,
    rent,
    expenses,
    bankRatio,
    salaries,
    saudizationSalary,
    bills,
    bills1,
    bills2,
  };
};

const calculateRentColumntTotal = () => {
  let totalRent = 0;

  $("tr .rent").each(function (index, value) {
    let currentValue = parseFloat($(this).val());
    if (!currentValue || isNaN(currentValue)) {
      currentValue = 0;
    } else {
      currentValue = currentValue;
    }

    totalRent += currentValue * 1;
  });

  document.getElementById("total-rent").innerHTML =
    parseFloat(totalRent).toFixed(2);
};

const calculateBankRatioColumntTotal = () => {
  let totalBankRatio = 0;

  $("tr .bank-ratio").each(function (index, value) {
    let currentValue = parseFloat($(this).val());
    if (!currentValue || isNaN(currentValue)) {
      currentValue = 0;
    } else {
      currentValue = currentValue;
    }

    totalBankRatio += currentValue * 1;
  });

  document.getElementById("total-bank-ratio").innerHTML =
    parseFloat(totalBankRatio).toFixed(2);
};

const calculateSaudizationSalaryColumntTotal = () => {
  let totalRent = 0;

  $("tr .saudization-salary").each(function (index, value) {
    let currentValue = parseFloat($(this).val());
    if (!currentValue || isNaN(currentValue)) {
      currentValue = 0;
    } else {
      currentValue = currentValue;
    }

    totalRent += currentValue * 1;
  });

  document.getElementById("total-saudization-salary").innerHTML =
    parseFloat(totalRent).toFixed(2);
};

const calculateBillsColumntTotal = () => {
  let totalBills = 0;

  $("tr .bills").each(function (index, value) {
    let currentValue = parseFloat($(this).val());
    if (!currentValue || isNaN(currentValue)) {
      currentValue = 0;
    } else {
      currentValue = currentValue;
    }

    totalBills += currentValue * 1;
  });

  document.getElementById("total-bills").innerHTML =
    parseFloat(totalBills).toFixed(2);
};

const calculateBills1ColumntTotal = () => {
  let totalBills1 = 0;

  $("tr .bills1").each(function (index, value) {
    let currentValue = parseFloat($(this).val());
    if (!currentValue || isNaN(currentValue)) {
      currentValue = 0;
    } else {
      currentValue = currentValue;
    }

    totalBills1 += currentValue * 1;
  });

  document.getElementById("total-bills1").innerHTML =
    parseFloat(totalBills1).toFixed(2);
};

const calculateBills2ColumntTotal = () => {
  let totalBills2 = 0;

  $("tr .bills2").each(function (index, value) {
    let currentValue = parseFloat($(this).val());
    if (!currentValue || isNaN(currentValue)) {
      currentValue = 0;
    } else {
      currentValue = currentValue;
    }

    totalBills2 += currentValue * 1;
  });

  document.getElementById("total-bills2").innerHTML =
    parseFloat(totalBills2).toFixed(2);
};

const calculateTotalIncomeColumntTotal = () => {  
  let totalNetIncome = 0;

  $("tr .net-income").each(function (index, value) {
    let currentValue = $(this).val();
    if (!currentValue) {
      currentValue = 0;
    } else {
      currentValue = numeral(currentValue).value();
    }

    totalNetIncome += currentValue * 1;
  });

  document.getElementById("total-net-income").innerHTML =
    numeral(totalNetIncome).format('0,0.00');
};

$("#add-financial-table").delegate("input", "keyup", "change", function (e) {
  let row = $(this).closest("tr");

  let incomeValue = $(".income", row).val();
  let expensesValue = $(".expenses", row).val();
  let rentValue = $(".rent", row).val();
  let bankRatioValue = $(".bank-ratio", row).val();
  let salariesValue = $(".salaries", row).val();
  let saudizationSalaryValue = $(".saudization-salary", row).val();
  let billsValue = $(".bills", row).val();
  let bills1Value = $(".bills1", row).val();
  let bills2Value = $(".bills2", row).val();

  const {
    income,
    rent,
    expenses,
    bankRatio,
    salaries,
    saudizationSalary,
    bills,
    bills1,
    bills2,
  } = validateFinancialInput(
    incomeValue,
    rentValue,
    expensesValue,
    bankRatioValue,
    salariesValue,
    saudizationSalaryValue,
    billsValue,
    bills1Value,
    bills2Value
  );

  let netIncome = (
    parseFloat(income) -
    parseFloat(rent) -
    parseFloat(expenses) -
    parseFloat(bankRatio) -
    parseFloat(salaries) -
    parseFloat(saudizationSalary) -
    parseFloat(bills) -
    parseFloat(bills1) -
    parseFloat(bills2)
  ).toFixed(2);

  netIncome = numeral(netIncome).format('0,0.00');

  $(".net-income", row).val(netIncome);

  calculateRentColumntTotal();
  calculateBankRatioColumntTotal();
  calculateSaudizationSalaryColumntTotal();
  calculateBillsColumntTotal();
  calculateBills1ColumntTotal();
  calculateBills2ColumntTotal();
  calculateTotalIncomeColumntTotal();
});

const  getNumberWithCommas = (number) => {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
