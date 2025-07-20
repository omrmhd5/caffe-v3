// const submitSearchForm = function () {
//   let isFrom = true;
//   let isTo = true;
//   let isBranched = true;

//   let from = document.getElementById("fromDate");
//   let to = document.getElementById("toDate");
  
//   let branch = document.getElementById("branchID");
//   let form = document.getElementById("search-form");
  
//   if (branch) {
//     if (branch.value) {
//       isBranched = true;
//     } else {
//       isBranched = false;
//     }
//   }

//   if (from) {
//     if (from.value) {
//       isFrom = true;
//     } else {
//       isFrom = false;
//     }
//   }

//   if (to) {
//     if (to.value) {
//       isTo = true;
//     } else {
//       isTo = false;
//     }
//   }

//   console.log(from, to);
//   console.log(from > to);

//   if (isFrom && isTo && isBranched) {
//     if (from < to) {
//       form.submit();
//     } else {
//       alert("التاريخ من أكبر من إلى");
//     }
//   }
// };