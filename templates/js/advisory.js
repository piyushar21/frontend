document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("current-year").textContent =
    new Date().getFullYear();
});

const backButton = document.getElementById("backButton");
backButton.addEventListener("click", function (e) {
  e.preventDefault();
  history.back();
});
