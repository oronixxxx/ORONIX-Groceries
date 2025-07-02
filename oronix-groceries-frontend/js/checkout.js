// checkout.js

import { ensureAuthenticated, getAuthHeaders} from "./auth.js";
import { getCartItems, clearCart } from './services/cartService.js';
import { toCamelCase } from './services/imageService.js'

// helper: if window.config isn't ready yet, wait for the 'configLoaded' event
function waitForConfig() {
    return window.config
    ? Promise.resolve()
    : new Promise(resolve => window.addEventListener('configLoaded', resolve));
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load configuration first, then enforce authentication and initialize the checkout page
        await waitForConfig();

        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", function (event) {
                event.preventDefault();
                sessionStorage.clear();
                window.location.href = window.config.app.homePageUrl;
            });
        }
        
        // Ensure user is authenticated and token is valid before any further actions
        ensureAuthenticated(window.config.cognito.loginUrl);

        await loadCartItems();
        
        document.getElementById('checkout-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await placeOrder();
        });
        
    } catch (error) {
        console.error("Checkout init failed:", error);
    }
    
});

async function loadCartItems() {
    const cartItems = await getCartItems();
    console.log('Loaded cart items:', cartItems);

    const container = document.getElementById('order-summary');
    const totalPriceElement = document.getElementById('total-price');

    container.innerHTML = '';

    let total = 0;

    if (cartItems.length === 0) {
        container.innerHTML = `
            <div class="text-gray-500 text-center text-lg">
                Your cart is empty. Go add some items!
            </div>
        `;
        totalPriceElement.textContent = '';
        return;
    }

    cartItems.forEach(item => {
        const itemTotal = Number(item.price) * Number(item.quantity);
        total += itemTotal;
        
        // Build image path based on item name (you can adjust this logic as needed)
        //const imageName = item.name.toLowerCase().replace(/\s/g, '');
        const imageName = toCamelCase(item.name);
        const imagePath = `images/items/${imageName}.png`;

        container.innerHTML += `
            <div class="flex items-center justify-between border-b pb-3 gap-4">
                <div class="flex items-center gap-3">
                    <img 
                        src="${imagePath}" 
                        alt="${item.name}" 
                        class="w-12 h-12 object-contain rounded"
                        onerror="this.onerror=null; this.src='images/items/logo.png';"
                    />
                    <span class="text-gray-700"><span class="font-bold">${item.name}</span> x ${Number(item.quantity)}</span>
                </div>
                <span class="font-medium text-blue-600">₪${itemTotal.toFixed(2)}</span>
            </div>
        `;
    });

    totalPriceElement.textContent = `Total price: ₪${total.toFixed(2)}`;
}

async function placeOrder() {
     const cartItems = await getCartItems();

    if (!cartItems || cartItems.length === 0) {
        alert("Your cart is empty. Please add items before placing an order.");
        return;
    }
    
    const form = document.getElementById('checkout-form');
    const formData = new FormData(form);
    const order = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        items: await getCartItems()
    };

    console.log('Placing order...', order);
    
    // Construct the endpoint URL
    const placeOrderAPI = window.config.api.placeOrder;
    // Retrieve authentication headers for API calls.
    const headers = getAuthHeaders();

    let body = {
        // "orderItems": await getCartItems()
        "order": order
    };

    try {
        const response = await fetch(placeOrderAPI, {
            method: "POST",
            headers: headers,
            mode: "cors",
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseBody = await response.json();
        console.log("Order Message:", responseBody.message);
        console.log("Order Details:", responseBody.data);
        
        alert('Order placed successfully!');
        clearCart();
        window.location.href = window.config.app.thankyouPageUrl || 'thankyou.html'; // 'thankyou.html'

        return true;
    } catch (error) {
        console.error("Error Details:", error);
        return false;
    }
}