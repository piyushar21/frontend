// frontend/js/market.js
document.addEventListener("DOMContentLoaded", () => {
  // Set current year in the footer
  document.getElementById("current-year").textContent =
    new Date().getFullYear();

  // Load products when the DOM is fully loaded
  loadProducts();
});

const backButton = document.getElementById("backButton");
backButton.addEventListener("click", function (e) {
  e.preventDefault();
  history.back(); // Go back to the previous page in history
});

const sellForm = document.getElementById("sellForm");
const sellStatus = document.getElementById("sellStatus");
const productListings = document.getElementById("productListings"); // Get the container for listings

sellForm.addEventListener("submit", async function (e) {
  e.preventDefault(); // Prevent default form submission

  // Get values from the form fields
  const productName = document.getElementById("productName").value;
  const productDescription =
    document.getElementById("productDescription").value;
  const productPrice = document.getElementById("productPrice").value;
  const contactInfo = document.getElementById("contactInfo").value;

  // Create an object with the product data to send to the backend
  const productData = {
    productName: productName,
    productDescription: productDescription,
    productPrice: parseFloat(productPrice), // Convert price to a number
    contactInfo: contactInfo,
  };

  try {
    // Send a POST request to your backend API
    const response = await fetch("http://localhost:3000/api/products", { // Ensure this URL matches your backend server
      method: "POST",
      headers: {
        "Content-Type": "application/json", // Indicate that you are sending JSON data
      },
      body: JSON.stringify(productData), // Convert the JavaScript object to a JSON string
    });

    if (response.ok) {
      // If the response is successful (status 2xx)
      sellStatus.textContent = "Product listed successfully!";
      sellStatus.classList.remove("hidden", "text-red-600"); // Remove hidden and error classes
      sellStatus.classList.add("text-green-700"); // Add success class
      sellForm.reset(); // Clear the form fields
      loadProducts(); // Reload products to display the newly added one
    } else {
      // If the response indicates an error
      const errorData = await response.json(); // Parse error response from backend
      sellStatus.textContent = `Error listing product: ${errorData.message || response.statusText}`;
      sellStatus.classList.remove("hidden", "text-green-700"); // Remove success class
      sellStatus.classList.add("text-red-600"); // Add error class
    }
  } catch (error) {
    // Handle network errors (e.g., backend server is not running)
    console.error("Network error:", error);
    sellStatus.textContent = "Network error. Please try again.";
    sellStatus.classList.remove("hidden", "text-green-700");
    sellStatus.classList.add("text-red-600");
  }

  // Hide the status message after 5 seconds
  setTimeout(() => {
    sellStatus.classList.add("hidden");
  }, 5000);
});

// Function to fetch and display products
async function loadProducts() {
  productListings.innerHTML = `
      <p class="text-center text-gray-600 italic">
          Loading products...
      </p>
  `; // Show loading message

  try {
    // Fetch products from your backend API
    const response = await fetch("http://localhost:3000/api/products"); // Ensure this URL matches your backend server
    const products = await response.json(); // Parse the JSON response

    if (products && products.length > 0) {
      productListings.innerHTML = ""; // Clear the loading message
      // Iterate over each product and create its HTML representation
      products.forEach((product) => {
        const productHtml = `
                      <div class="bg-gray-50 p-4 rounded-lg shadow-md border border-gray-200 flex items-center space-x-4">
                          <img src="https://placehold.co/80x80/E0E7FF/1D4ED8?text=Product" alt="${product.productName}"
                              class="w-20 h-20 object-cover rounded-lg">
                          <div>
                              <h3 class="text-lg font-semibold text-gray-900">${product.productName}</h3>
                              <p class="text-green-600 font-bold text-xl">₹${product.productPrice} / unit</p>
                              <p class="text-gray-600 text-sm">${product.productDescription}</p>
                              <p class="text-gray-500 text-xs">Contact: ${product.contactInfo}</p>
                          </div>
                      </div>
                  `;
        productListings.insertAdjacentHTML("beforeend", productHtml); // Add product HTML to the list
      });
    } else {
      // If no products are found
      productListings.innerHTML = `
            <p class="text-center text-gray-600 italic">
                No products listed yet. Be the first to sell!
            </p>
        `;
    }
  } catch (error) {
    // Handle errors during fetching products
    console.error("Error fetching products:", error);
    productListings.innerHTML = `
        <p class="text-center text-red-600 italic">
            Error loading products. Please try again later.
        </p>
    `;
  }
}