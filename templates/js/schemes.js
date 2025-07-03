document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("current-year").textContent =
    new Date().getFullYear();

  const backButton = document.getElementById("backButton");
  backButton.addEventListener("click", function (e) {
    e.preventDefault();
    history.back();
  });

  const stateFilter = document.getElementById("stateFilter");
  const schemeCards = document.querySelectorAll(".scheme-card");
  const centralSchemesHeader = document.getElementById("centralSchemesHeader");
  const stateSchemesHeader = document.getElementById("stateSchemesHeader");

  function filterSchemes() {
    const selectedState = stateFilter.value;

    let hasCentralSchemes = false;
    let hasStateSchemes = false;

    schemeCards.forEach((card) => {
      const cardState = card.dataset.state;

      if (selectedState === "all") {
        card.classList.add("active");
        if (cardState === "all") hasCentralSchemes = true;
        else hasStateSchemes = true;
      } else if ((cardState === "all") | (cardState === selectedState)) {
        card.classList.add("active");
        if (cardState === "all") hasCentralSchemes = true;
        else hasStateSchemes = true;
      } else {
        card.classList.remove("active");
      }
    });

    centralSchemesHeader.style.display = hasCentralSchemes ? "block" : "none";
    stateSchemesHeader.style.display = hasStateSchemes ? "block" : "none";
  }

  stateFilter.addEventListener("change", filterSchemes);

  filterSchemes();
});
