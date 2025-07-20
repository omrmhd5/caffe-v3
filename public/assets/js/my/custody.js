const deleteCustody = (id) => {
  let url = `custody/${id}`;
  let method = 'DELETE';
  let title = "هل انت متأكد من حذف العهدة";
  let text = "سيتم حذف جميع البيانات المتعلقة بالعهدة";
  let confirmText = "نعم ";
  let cancelText = "لا";

  callUrl(url, method, false, title, text, confirmText, cancelText, null);
};

function callUrl(
  url,
  method,
  block,
  title,
  text,
  confirmText,
  cancelText,
  button = null
) {
  swal({
    title,
    text,
    type: "warning",
    buttons: {
      confirm: {
        text: confirmText,
        className: "btn btn-danger",
      },
      cancel: {
        text: cancelText,
        visible: true,
        className: "btn btn-success",
      },
    },
  }).then((OK) => {
    if (OK) {
      $.ajax({
        url,
        type: method,
        data: { block },
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
              location.assign("/custody/");
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

function specialItemsCountShow() {
  if (document.querySelector("#hasSpecialItems").checked) {
    document.querySelector("#specialItemsCount").disabled = false;
  } else {
    document.querySelector("#specialItemsCount").disabled = true;
  }
}

// Initialize date values if empty
if (document.getElementById("fromDate")) {
  if (!document.getElementById("fromDate").value) {
    let yesterday = moment().subtract(1, "days");

    yesterday = yesterday.format("MM/DD/YYYY H:mm");
    document.getElementById("fromDate").value = yesterday;
  }
}

if (document.getElementById("toDate")) {
  if (!document.getElementById("toDate").value) {
    document.getElementById("toDate").value =
      moment().format("MM/DD/YYYY H:mm");
  }
}
