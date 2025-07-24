$("#store-table").delegate("input", "keyup", "change", function (e) {
  const row = $(this).closest("tr");

  const addedQuantity = parseInt($(".added-quantity", row).val());
  const boughtQuantity = parseInt($(".origin-bought-quantity", row).val());
  const soldQuantity = parseInt($(".sold-quantity", row).val());
  const updatedQuantity = addedQuantity + boughtQuantity;

  $(".bought-quantity", row).val(updatedQuantity);
  $(".current-quantity", row).val(updatedQuantity - soldQuantity);

  const realCurrentQuantity =
    parseInt($(".real-current-quantity", row).val()) || 0;
  const currentQuantity = parseInt($(".current-quantity", row).val()) || 0;
  const itemPrice = parseInt($(".item-price", row).val()) || 0;

  const shortage = currentQuantity - realCurrentQuantity;

  $(".shortage", row).val(shortage);
  $(".shortage-value", row).val(shortage * itemPrice);

  calculateColumnsTotal();
});

const sendData = (button) => {
  const row = button.closest(".d-income-tr");
  const url = "/store";
  const method = "POST";

  const itemID = $("#item-id", row).val();
  const addedQuantity = parseInt($(".added-quantity", row).val());
  const realCurrentQuantity = parseInt($(".real-current-quantity", row).val());

  callUrl(url, method, {
    data: JSON.stringify({
      addedQuantity,
      realCurrentQuantity,
      itemID,
    }),
  });

  $(".added-quantity").val(0);
};

const resetStore = () => {
  swal({
    title: " انت متأكد ؟",
    text: "سيتم حذف جميع بيانات المخزون لهذا الفرع ",
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
  }).then((yes) => {
    if (yes) {
      const branchID = $("#branchID").val();
      if (!branchID) {
        return;
      }

      const url = `/store/reset/${branchID}`;
      const method = "POST";

      callUrl(url, method, {
        data: JSON.stringify(),
      });

      $(".added-quantity").val(0);
      $(".bought-quantity").val(0);
      $(".current-quantity").val(0);
      $(".real-current-quantity").val(0);
      $(".shortage").val(0);
      $(".shortage-value").val(0);
    } else {
      swal.close();
    }
  });
};

function callUrl(url, method, data) {
  $.ajax({
    url,
    type: method,
    data,
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

const calculateColumnsTotal = () => {
  let shortageValueTotal = 0;

  $("tr .shortage-value").each(function (index, value) {
    let currentValue = parseFloat($(this).val());
    currentValue = validateInputValue(currentValue);
    shortageValueTotal += currentValue;
  });

  $(".shortage-value-total").val(parseFloat(shortageValueTotal).toFixed(2));
};

const validateInputValue = (value) => {
  if (!value || isNaN(value)) {
    return 0;
  } else {
    return value;
  }
};
