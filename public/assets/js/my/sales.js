Date.prototype.toDateInputValue = function () {
  let local = new Date(this);
  local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
  return local.toJSON().slice(0, 7);
};

const showNotification = function (state, message) {
  var placementFrom = "top";
  var placementAlign = "left";
  var style = "withicon";
  var content = {};

  content.message = message;
  content.title = "إضافة شركة";

  if (style == "withicon") {
    content.icon = "fa fa-bell";
  } else {
    content.icon = "none";
  }

  content.url = "index.html";
  content.target = "_blank";

  $.notify(content, {
    type: state,
    placement: {
      from: placementFrom,
      align: placementAlign,
    },
    time: 1000,
    delay: 0,
  });
};

function deleteSales(id) {
  swal({
    title: "هل انت متأكد من حذف المبيعات",
    text: "سيتم حذف جميع البيانات المتعلقة بها ",
    type: "warning",
    buttons: {
      confirm: {
        text: "نعم ",
        className: "btn btn-danger",
      },
      cancel: {
        text: "لا ",
        visible: true,
        className: "btn btn-success",
      },
    },
  }).then((Delete) => {
    if (Delete) {
      $.ajax({
        url: `sales/${id}`,
        type: "DELETE",
        success: (data, status, xhr) => {
          swal({
            title: "حُذِفت  بنجاح",
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
    } else {
      swal.close();
    }
  });
}

function showImage(src) {
  // Get the image and insert it inside the modal - use its "alt" text as a caption
  let modalImg = document.getElementById("img01");
  let modal = document.getElementById("imageModal");

  modal.style.display = "block";
  modalImg.src = src;
}

// Initialize date values if empty
if (document.getElementById("fromDate")) {
  if (!document.getElementById("fromDate").value) {
    let yesterday = moment().subtract(1, "days");

    yesterday = yesterday.format("MM/DD/YYYY");
    document.getElementById("fromDate").value = yesterday;
  }
}

if (document.getElementById("toDate")) {
  if (!document.getElementById("toDate").value) {
    document.getElementById("toDate").value = moment().format("MM/DD/YYYY");
  }
}

if (document.getElementById("query-date")) {
  if (!document.getElementById("query-date").value) {
    document.getElementById("query-date").value = moment().format("YYYY-MM-DD");
  }
}

if (document.getElementById("month")) {
  if (!document.getElementById("month").value) {
    document.getElementById("month").value = moment().format("YYYY/MM");
  }
}

let times = document.getElementsByClassName("time");
for (let timeInput of times) {
  let time = moment().format("hh:mm");
  timeInput.value = time;
}

const sendData = (event) => {
  event.preventDefault();

  let url = "/sales/add";
  let method = "POST";

  let table = document.getElementById("add-sales-table");

  let data = [];

  let branchID = $("#branchID").val();

  let date = $("#query-date").val();
  date = new Date(date);
  date = moment(date).format("YYYY-MM-DD");

  for (let i = 0, row; (row = table.rows[i]); i++) {
    let salesData = {};

    let itemID = $(".itemID", row).val();
    let boughtquantity = $(".bought-quantity", row).val() || 0;

    salesData.itemID = itemID;
    salesData.boughtquantity = boughtquantity;

    data.push(salesData);
  }

  callUrl(url, method, {
    data: JSON.stringify(data),
    date: JSON.stringify(date),
    branchID: JSON.stringify(branchID),
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
          return false;
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
          location.assign("/sales/add/");
          swal.close();
        }
      });
    },
  });
}

let button = document.getElementById("submit-button");
if (button) {
  button.addEventListener("click", sendData);
}

const calculateColumnsTotal = () => {
  let amountTotal = 0;
  let dayTotalValue = $("#dayTotalValue").val();
  dayTotalValue = parseInt(dayTotalValue) || 0;

  $("tr .amount").each(function (index, value) {
    let currentValue = parseFloat($(this).val());

    currentValue = currentValue || 0;
    amountTotal += currentValue;
  });

  $("#todaySaleTotal").html(amountTotal);

  $("#sales-total").html(amountTotal);
};

$("#add-sales-table").delegate("input", "keyup", "change", function (e) {
  let row = $(this).closest("tr");

  let qty = $(".bought-quantity", row).val() || 0;
  let price = $(".price", row).val() || 0;

  let currentTodayQty = $(".bought-quantity", row).val();
  currentTodayQty = parseInt(currentTodayQty) || 0;

  let todayQty = $(".item-bought-quantity-original", row).val();
  todayQty = parseInt(todayQty) || 0;

  $(".item-bought-quantity", row).val(
    parseInt(currentTodayQty) + parseInt(todayQty)
  );

  qty = parseInt(qty) || 0;

  $(".amount", row).val(qty * price);

  calculateColumnsTotal();
});
