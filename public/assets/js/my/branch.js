// function deleteBranch(id) {
//   if (confirm("هل انت متأكد من حذف الطلب")) {
//     $.ajax({
//       url: `branches/${id}`,
//       type: "DELETE",
//       statusCode: {
//         200: (data) => {
//           if (data.success) {
//             alert(data.success);
//             location.reload();
//           } else {
//             alert(data.error);
//             location.reload();
//           }
//         },
//       },
//     });
//   } else {
//     alert(data.error);
//     location.reload();
//   }
// }

function deleteBranch(id) {
  swal({
    title: "هل انت متأكد من حذف الفرع",
    text: "سيتم حذف جميع البيانات المتعلقة بهذا الفرع",
    type: "warning",
    buttons: {
      confirm: {
        text: "نعم ",
        className: "btn btn-danger",
      },
      cancel: {
        text: "لا",
        visible: true,
        className: "btn btn-success",
      },
    },
  }).then((Delete) => {
    if (Delete) {
      $.ajax({
        url: `branches/${id}`,
        type: "DELETE",
        success: (data, status, xhr) => {
          swal({
            title: "حذف الفرع بنجاح",
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
