const changeUserStatus = (id, button) => {
  let url = `users/${id}/block`;
  let method = "POST";
  let title = "هل انت متأكد من إيقاف المستخدم";
  let text = "لن يستطيع المستخدم تسجيل الدخول إلا إذا تم تغيير الحالة";
  let confirmText = "نعم ";
  let cancelText = "لا ";
  let block = true;

  if (button.checked === true) {
    title = "هل انت متأكد من تفعيل المستخدم";
    text = "  سيتمكن المستخدم من استخدام النظام إذا تم تغيير الحالة";
    confirmText = "نعم ";
    block = false;
  }

  callUrl(url, method, block, title, text, confirmText, cancelText, button);
};

const deleteUser = (id) => {
  let url = `users/${id}`;
  let method = "DELETE";
  let title = "هل انت متأكد من حذف المستخدم";
  let text = "سيتم حذف جميع البيانات المتعلقة بالمستخدم";
  let confirmText = "نعم ";
  let cancelText = "لا ";

  callUrl(url, method, false, title, text, confirmText, cancelText, null);
};
//Show notification
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
              location.assign("/users");
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
      //Quick solution to prevent the infinit loop :)
      if (button) {
        $(button).bootstrapToggle("destroy");
        $(button).prop("checked", block);
        $(button).bootstrapToggle();
      }
      swal.close();
    }
  });
}

const submitSearchForm = function () {
  let branch = document.getElementById("branchID");
  let form = document.getElementById("search-form");

  // if (branch.value) {
    form.submit();
  // }
};
