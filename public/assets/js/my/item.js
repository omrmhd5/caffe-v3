// addSpecialItemsShow();

const deleteItem = (id) => {
  let url = `items/${id}`;
  let method = "DELETE";
  let title = "هل انت متأكد من حذف الصنف";
  let text = "سيتم حذف جميع البيانات المتعلقة بالصنف";
  let confirmText = "نعم ";
  let cancelText = "لا ";

  callUrl(url, method, false, title, text, confirmText, cancelText, null);
};

const updateItem = () => {
  const id = $("#itemID").val();
  const url = `/items/${id}/edit`;
  const method = "POST";
  const itemName = $("#itemName").val() || null;
  const itemPrice = $("#itemPrice").val() || null;
  const branchID = $("#branchID").val() || null;
  const isSpecial = $("#editHasSpecialItems").is(":checked");
  const isHidden = $("#editIsHidden").is(":checked");

  const items = [];
  const specialItems = document.getElementsByClassName("specialItemsID");
  for (let specialItem of specialItems) {
    let specialItemID = $(".itemID", specialItem).val();
    let qty = $(".qty", specialItem).val();

    if (!specialItemID || !qty) {
      continue;
    }

    items.push({
      itemID: specialItemID,
      qty,
    });
  }

  const body = {
    itemName: JSON.stringify(itemName),
    itemPrice: JSON.stringify(itemPrice),
    branchID: JSON.stringify(branchID),
    specialItems: JSON.stringify(items),
    isSpecial: JSON.stringify(isSpecial),
    isHidden: JSON.stringify(isHidden),
  };

  callFormSubmitUrl(url, method, body);
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

  const branchID = document.getElementById("branchID").value;

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
              location.assign(`/items?branchID=${branchID}`);
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

function callFormSubmitUrl(url, method, data) {
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

function specialItemsCountShow() {
  if (document.querySelector("#hasSpecialItems").checked) {
    document.querySelector("#specialItemsCount").disabled = false;
  } else {
    document.querySelector("#specialItemsCount").disabled = true;
  }
}

function addSpecialItemsShow() {
  if (
    document.querySelector("#editHasSpecialItems") &&
    document.querySelector("#editHasSpecialItems").checked
  ) {
    document.querySelector("#specialItemsGroup").style.display = "block";
    document.querySelector("#special-items").style.display = "block";
  } else {
    document.querySelector("#specialItemsGroup").style.display = "none";
    document.querySelector("#special-items").style.display = "none";
  }
}

let addSpecialItemButton = document.getElementById("add-special-item");
if (addSpecialItemButton) {
  addSpecialItemButton.addEventListener("click", addSpecialItem);
}

const removeSpecialItem = (input) => {
  input.parentNode.parentNode.parentNode.remove();
};
