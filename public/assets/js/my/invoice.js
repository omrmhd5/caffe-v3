const deleteInvoice = (id) => {
  let url = `invoice/${id}`;
  let method = "DELETE";
  let title = "هل انت متأكد من حذف الفاتورة";
  let text = "سيتم حذف جميع البيانات المتعلقة بالفاتورة";
  let confirmText = "نعم ";
  let cancelText = "لا ";

  callUrl(url, method, false, title, text, confirmText, cancelText, null);
};

const calculateTax = () => {
  const taxValue = document.getElementById("taxValue");
  const taxRatio = document.getElementById("taxRatio").value;
  const invoiceAmount = document.getElementById("amount").value;
  const invoiceTotal = document.getElementById("totalAmount");

  if (invoiceAmount && taxRatio) {
    taxValue.value = invoiceAmount * taxRatio / 100;

    invoiceTotal.value = parseFloat(taxValue.value) + parseFloat(invoiceAmount);
    invoiceTotal.value = parseFloat(invoiceTotal.value).toFixed(2); 
  } 
}

if (document.getElementById("amount")) {
  document.getElementById("amount").addEventListener('change', calculateTax);
}

if (document.getElementById("taxRatio")) {
  document.getElementById("taxRatio").addEventListener('change', calculateTax);
}

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

if (document.getElementById("image")) {
  document.getElementById("image").onchange = uploadOnChange;
}

function uploadOnChange() {
  let fileName = this.value;
  let lastIndex = fileName.lastIndexOf("\\");

  if (lastIndex >= 0) {
    fileName = fileName.substring(lastIndex + 1);
  }

  document.getElementById("image-label").innerHTML = fileName;
}

function warrantyShow() {
  if (document.querySelector("#warranty").checked) {
    document.querySelector("#warrantyYears").disabled = false;
  } else {
    document.querySelector("#warrantyYears").disabled = true;
  }
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
    document.getElementById("toDate").value =
      moment().format("MM/DD/YYYY");
  }
}

if (document.getElementById("date")) {
  if (!document.getElementById("date").value) {
    document.getElementById("date").value = moment().format('YYYY-MM-DD');
  }
}

const showImage = (image) => {

}

$('#modal-image').on('show.bs.modal', function (event) {
  const button = $(event.relatedTarget);
  const image = button.data('whatever');

  const modal = $(this)

  let img = modal.find("#modal-image-content");
  img.attr("src", image);
})
