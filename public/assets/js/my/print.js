const printData = () => {
  let report = document.getElementById("report");
  if (report) {
    report.style.display = "block";
  }
  window.print();
  if (report) {
    report.style.display = "none";
  }
};

let printButton = document.getElementById("print-button");
if (printButton) {
  printButton.addEventListener("click", printData);
}
