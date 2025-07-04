import { ensureAuthenticated, getAuthHeaders } from "./auth.js";
import { addToCart, removeFromCart, getCartItems, updateCartItemQuantity } from './services/cartService.js';
import { toCamelCase } from './services/imageService.js'

// helper: if window.config isn't ready yet, wait for the 'configLoaded' event
function waitForConfig() {
    return window.config
    ? Promise.resolve()
    : new Promise(resolve => window.addEventListener('configLoaded', resolve));
}

document.addEventListener('DOMContentLoaded', async () => {
    // Load configuration first, then enforce authentication and initialize the cart page
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

        // After authentication check, initialize the page
        let cartItems = await getCartItems();
        renderCartItems(cartItems);
        updateTotalPrice(cartItems);

    } catch (error) {
        console.error('Error loading cart:', error);

        const cartContainer = document.getElementById('cart-items');
        cartContainer.innerHTML = '<p class="text-red-500">Error loading cart items.</p>';
    }
});

function renderCartItems(items) {
    const cartContainer = document.getElementById('cart-items');
    cartContainer.innerHTML = '';

    if (items.length === 0) {
        cartContainer.innerHTML = '<p class="text-gray-500">Your cart is empty.</p>';
        return;
    }

    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'flex items-center justify-between p-4 border-b';

        const imageName = toCamelCase(item.name);
        const price = Number(item.price);
        const quantity = Number(item.quantity)
        
        itemElement.innerHTML = `
            <div class="flex flex-row items-center justify-between w-70 gap-20">
                <div class="flex flex-col items-center">
                    <img 
                        src="images/items/${imageName}.png" 
                        alt="${item.name}" 
                        class="flex justify-center w-20 h-20 object-contain rounded-lg mr-4"
                        onerror="this.onerror=null; this.src='images/items/logo.png';"
                    >
                </div>
                <div class="flex flex-col items-center w-40 gap-4">
                    <h3 class="text-4xl font-semibold flex items-center">${item.name}</h3>
                    <p class="text-blue-500 items-center text-xl">₪${(price * quantity).toFixed(2)}</p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <input type="number" value="${quantity}" min="1" class="quantity-input w-28 h-10 text-center border rounded-lg">
                <button class="remove-btn bg-red-500 text-white ml-10 px-6 py-1 rounded-lg hover:bg-red-600 w-28 h-10">Remove</button>
            </div>
        `;

        const quantityInput = itemElement.querySelector('.quantity-input');
        const removeButton = itemElement.querySelector('.remove-btn');

        quantityInput.addEventListener('change', async () => {
            const newQuantity = parseInt(quantityInput.value);
            if (newQuantity > 0) {
                await updateCartItemQuantity(item.id, newQuantity);
                renderCartItems(await getCartItems());
                updateTotalPrice(await getCartItems());
            } else {
                alert('Quantity must be at least 1.');
                quantityInput.value = item.quantity;
            }
        });

        removeButton.addEventListener('click', async () => {
            await removeFromCart(item.id);
            renderCartItems(await getCartItems());
            updateTotalPrice(await getCartItems());
        });

        cartContainer.appendChild(itemElement);
    });
}

function updateTotalPrice(items) {
    const totalPriceElement = document.getElementById('total-price');
    if (!totalPriceElement) {
        console.warn('total-price element not found in DOM');
        return;
    }

    const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    totalPriceElement.textContent = `Total: ₪${totalPrice.toFixed(2)}`;
}