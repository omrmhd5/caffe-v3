const deleteEmployee = (id) => {
  let url = `employees/${id}`;
  let method = 'DELETE';
  let title = "هل انت متأكد من حذف الموظف";
  let text = "سيتم حذف جميع البيانات المتعلقة الموظف";
  let confirmText = "نعم ";
  let cancelText = "لا ";

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
              location.assign("/employees");
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
