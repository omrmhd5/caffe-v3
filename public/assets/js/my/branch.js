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

function toggleBranchHidden(id, checked) {
  const url = checked ? `/branches/${id}/unhide` : `/branches/${id}/hide`;
  $.ajax({
    url: url,
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify({}),
    success: function (data) {
      location.reload();
    },
    error: function (jqXhr) {
      alert(
        jqXhr.responseJSON && jqXhr.responseJSON.errorMessage
          ? jqXhr.responseJSON.errorMessage
          : "حدث خطأ"
      );
      location.reload();
    },
  });
}
