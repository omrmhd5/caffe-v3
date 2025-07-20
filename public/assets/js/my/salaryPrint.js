const printData = () => {
  window.print();
}

let printButton = document.getElementById("print-button");
if (printButton) {
  printButton.addEventListener("click", printData);
}