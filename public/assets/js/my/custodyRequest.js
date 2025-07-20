const deleteRequest = (id) => {
  let url = `/custodyRequest/${id}`;
  let method = 'DELETE';
  let title = "هل انت متأكد من حذف الطلب";
  let text = "سيتم حذف جميع البيانات المتعلقة بالطلب";
  let confirmText = "نعم ";
  let cancelText = "لا ";

  callUrl(url, method, false, title, text, confirmText, cancelText, null);
};

const rejectRequest = (id) => {
  let url = `/custodyRequest/${id}/reject`;
  let method = 'POST';
  let title = "هل انت متأكد من رفض الطلب";
  let text = "لا يمكن تغيير حالة الطلب بعد الرفض";
  let confirmText = "نعم ";
  let cancelText = "لا ";

  callUrl(url, method, false, title, text, confirmText, cancelText, null);
};

const acceptRequest = (id) => {
  let url = `/custodyRequest/${id}/accept`;
  let method = 'POST';
  let title = " الموافقة على الطلب";
  let text = "سيتم خصمم العدد من العهدة";
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
