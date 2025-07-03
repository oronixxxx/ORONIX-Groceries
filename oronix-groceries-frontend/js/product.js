import { ensureAuthenticated, getAuthHeaders } from "./auth.js";
import { toCamelCase } from './services/imageService.js';
import { addToCart, getCartItems, updateCartItemQuantity } from './services/cartService.js';


// helper: if window.config isn't ready yet, wait for the 'configLoaded' event
function waitForConfig() {
  return window.config
  ? Promise.resolve()
  : new Promise(resolve => window.addEventListener('configLoaded', resolve));
}

document.addEventListener('DOMContentLoaded', async () => { 
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    const container = document.getElementById('product-details');
    //const cartItems = await getCartItems();

    // Load configuration first, then enforce authentication and initialize the product page
    await waitForConfig();

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function (event) {
        event.preventDefault();
        sessionStorage.clear();
        window.location.href = window.config.app.homePageUrl;
      });
    }
    
    try {
        // Ensure user is authenticated and token is valid before any further actions
        ensureAuthenticated(window.config.cognito.loginUrl);

        const item = await fetchItemDetails(Number(productId));

        // const res = await fetch("data/oronix_items.json");
        // const items = await res.json();
        // const item = items.find(item => item.id === Number(productId));

        if (!item) {
            container.innerHTML = '<p>Product not found.</p>';
            return;
        }

        const name = item.name.toUpperCase();
        //const imageName = item.name.toLowerCase().replace(/\s/g, '');
        const imageName = toCamelCase(item.name);
        const price = Number(item.price).toFixed(2);
        const category = item.category;
        const description = item.description || "No description available.";

        container.innerHTML = `
            <img 
              src="images/items/${imageName}.png" 
              alt="${name}" 
              class="w-80 h-80 object-contain mb-6 rounded-lg shadow-lg"
              onerror="this.onerror=null; this.src='images/items/logo.png';""
            />
            <h1 class="text-2xl font-bold text-gray-800 mb-2">${name}</h1>
            <p class="text-xl text-gray-500 mb-1"><span class="font-medium">${category}</span></p>
            <p class="text-lg font-semibold text-blue-700 mb-4">₪${price}</p>
            <p class="max-w-3xl text-gray-700 text-xl mb-6">${description}</p>
            <div class="flex gap-4">
                <button id="add-btn" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Add to Cart</button>
            </div>
        `;

        // Buttons logic 
/*         document.getElementById('add-btn').addEventListener('click', () => {
            addToCart(item, 1);
        });
 */
        document.getElementById('add-btn').addEventListener('click', async () => {
          const success = await addToCart(item, 1);
          if (success) {
              alert('Item added to cart successfully!');
          } else {
              alert('Failed to add item to cart. Please try again.');
          }
      });
    } catch (error) {
        container.innerHTML = `<p class="text-red-500">Error loading product details.</p>`;
        console.error(err);
    }
});

async function fetchItemDetails(itemId) {
  if (!itemId) return false;
  
  console.log("Fetching Item Details from the database.");
  const fetchItemDetailsAPI = `${window.config.api.fetchItemDetails}?id=${encodeURIComponent(itemId)}`;
  const headers = getAuthHeaders();
  // const headers = {
  //   "Content-Type": "application/json",
  //   "Authorization": sessionStorage.getItem("tokenId")
  // };

  try {
    const response = await fetch(fetchItemDetailsAPI, {
      method: "GET",
      headers: headers,
      mode: "cors",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const responseBody = await response.json();
    console.log("Item Details fetched successfully.", responseBody.data);
    return responseBody.data || null;
  } catch (error) {
    console.error("Error fetching Item Details:", error);
    return false;
  }
}