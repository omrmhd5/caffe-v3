$("#addCompanyButton").click(function (e) {
  document.getElementById("addCompanyForm").submit();
});

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

function showImage(src) {
  // Get the image and insert it inside the modal - use its "alt" text as a caption
  let modalImg = document.getElementById("img01");
  let modal = document.getElementById("imageModal");

  modal.style.display = "block";
  modalImg.src = src;
}

function toggleCompanyHidden(id, checked) {
  const url = checked ? `/companies/${id}/unhide` : `/companies/${id}/hide`;
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
