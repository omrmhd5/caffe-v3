const submitSearchForm = function () {
  let isDated = true;
  let isBranched = true;
  let date = document.getElementById("query-date");
  let branch = document.getElementById("branchID");
  let form = document.getElementById("search-form");
  
  if (branch) {
    if (branch.value) {
      isBranched = true;
    } else {
      isBranched = false;
    }
  }

  if (date) {
    if (date.value) {
      isDated = true;
    } else {
      isDated = false;
    }
  }

  if (isDated && isBranched) {
    form.submit();
  }
};