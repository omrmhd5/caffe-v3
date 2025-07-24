if (document.getElementById("month")) {
  if (!document.getElementById("month").value) {
    document.getElementById("month").value = moment().format("YYYY/MM");
  }
}

$(".edit-button").on("click", function () {
  let tr = $(this).closest("tr");
  let branchID = $(".branch-id", tr).text();
  let employeeID = $(".employee-id", tr).text();
  let date = $("#query-date").val();

  $("#editSalaryModal").on("show.bs.modal", function (event) {
    let modal = $(this);

    let salary = $(".salary-data", tr).text();
    let amountIncrease = $(".amount-increase", tr).text();
    let amountDecrease = $(".amount-decrease", tr).text();
    let daysIncrease = $(".days-increase", tr).text();
    let daysDecrease = $(".days-decrease", tr).text();
    let extraWork = $(".extra-work", tr).text();

    modal.find(".modal-body #modal-salary").val(salary);
    modal.find(".modal-body #modal-amount-increase").val(amountIncrease);
    modal.find(".modal-body #modal-amount-decrease").val(amountDecrease);
    modal.find(".modal-body #modal-days-increase").val(daysIncrease);
    modal.find(".modal-body #modal-days-decrease").val(daysDecrease);
    modal.find(".modal-body #modal-extra-work").val(extraWork);
    modal.find(".modal-body #modal-branch-id").text(branchID);
    modal.find(".modal-body #modal-employee-id").text(employeeID);
    modal.find(".modal-body #modal-date").text(date);
  });
});

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

const sendData = (event) => {
  event.preventDefault();

  let url = "/salary";
  let notes = [];
  let method = "POST";
  let date = $("#month").val();
  let table = document.getElementById("add-salary-table");

  let data = [];

  for (let i = 0, row; (row = table.rows[i]); i++) {
    let salaryData = {};
    let salaryValue = $(".salary", row).val();
    let amountDecreaseValue = $(".amount-decrease", row).val();
    let amountIncreaseValue = $(".amount-increase", row).val();
    let daysDecreaseValue = $(".days-decrease", row).val();
    let daysIncreaseValue = $(".days-increase", row).val();
    let extraWorkValue = $(".extra-work", row).val();

    const {
      salary,
      amountDecrease,
      amountIncrease,
      daysDecrease,
      daysIncrease,
      extraWork,
    } = validateSalaryInput(
      salaryValue,
      amountDecreaseValue,
      amountIncreaseValue,
      daysDecreaseValue,
      daysIncreaseValue,
      extraWorkValue
    );

    let employeeName = $(".name", row).val();

    if (employeeName) {
      salaryData.salary = salary;
      salaryData.amountDecrease = amountDecrease;
      salaryData.amountIncrease = amountIncrease;
      salaryData.daysDecrease = daysDecrease;
      salaryData.daysIncrease = daysIncrease;
      salaryData.extraWork = extraWork;
      salaryData.branchID = $(".branch-id", row).val();
      salaryData.employeeID = $(".employee-id", row).val();
      salaryData.netSalary = $(".net-salary", row).val() || 0;
      salaryData.netSalary = numeral(salaryData.netSalary).value();
      salaryData.date = date;

      data.push(salaryData);
    }
  }

  let notesElements = document.getElementsByClassName("note-input");
  for (let i = 0; i < notesElements.length; i++) {
    if (!notesElements[i].value) {
      continue;
    }

    notes.push({
      branchID: data[0].branchID,
      note: notesElements[i].value,
      date,
    });
  }

  callUrl(url, method, {
    data: JSON.stringify(data),
    notes: JSON.stringify(notes),
  });
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

let button = document.getElementById("submit-button");
if (button) {
  button.addEventListener("click", sendData);
}

const validateSalaryInput = (
  salary,
  amountDecrease,
  amountIncrease,
  daysDecrease,
  daysIncrease,
  extraWork
) => {
  if (!salary || isNaN(salary)) {
    salary = "0";
  } else {
    salary = parseFloat(salary).toFixed(2);
  }

  if (!amountDecrease || isNaN(amountDecrease)) {
    amountDecrease = "0";
  } else {
    amountDecrease = parseFloat(amountDecrease).toFixed(2);
  }

  if (!amountIncrease || isNaN(amountIncrease)) {
    amountIncrease = "0";
  } else {
    amountIncrease = parseFloat(amountIncrease).toFixed(2);
  }

  if (!daysDecrease || isNaN(daysDecrease)) {
    daysDecrease = "0";
  } else {
    daysDecrease = parseFloat(daysDecrease).toFixed(2);
  }

  if (!daysIncrease || isNaN(daysIncrease)) {
    daysIncrease = "0";
  } else {
    daysIncrease = parseFloat(daysIncrease).toFixed(2);
  }

  if (!extraWork || isNaN(extraWork)) {
    extraWork = "0";
  } else {
    extraWork = parseFloat(extraWork).toFixed(2);
  }

  return {
    salary,
    amountDecrease,
    amountIncrease,
    daysDecrease,
    daysIncrease,
    extraWork,
  };
};

$("#add-salary-table").delegate("input", "keyup", "change", function (e) {
  let row = $(this).closest("tr");

  let salaryValue = $(".salary", row).val();
  let amountDecreaseValue = $(".amount-decrease", row).val();
  let amountIncreaseValue = $(".amount-increase", row).val();
  let daysDecreaseValue = $(".days-decrease", row).val();
  let daysIncreaseValue = $(".days-increase", row).val();
  let extraWorkValue = $(".extra-work", row).val();

  const {
    salary,
    amountDecrease,
    amountIncrease,
    daysDecrease,
    daysIncrease,
    extraWork,
  } = validateSalaryInput(
    salaryValue,
    amountDecreaseValue,
    amountIncreaseValue,
    daysDecreaseValue,
    daysIncreaseValue,
    extraWorkValue
  );

  let netSalary = (
    parseFloat(salary) -
    parseFloat(amountDecrease) +
    parseFloat(amountIncrease) -
    parseFloat(daysDecrease * (salary / 30)) +
    parseFloat(daysIncrease * (salary / 30)) -
    parseFloat(extraWork)
  ).toFixed(2);

  $(".net-salary", row).val(netSalary);

  let totalSalaries = 0;

  $("tr .net-salary").each(function (index, value) {
    let currentValue = numeral($(this).val()).value();
    console.log(currentValue);

    totalSalaries += currentValue;
  });

  document.getElementById("salary-total").innerHTML = totalSalaries;
});
