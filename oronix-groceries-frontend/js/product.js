import { addToCart, getCartItems, updateCartItemQuantity } from './services/cartService.js';

document.addEventListener('DOMContentLoaded', async () => { 
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    const container = document.getElementById('product-details');
    const cartItems = await getCartItems();

    try {
        const res = await fetch("data/oronix_items.json");
        const items = await res.json();
        const item = items.find(item => item.id === Number(productId));

        if (!item) {
            container.innerHTML = '<p>Product not found.</p>';
            return;
        }

        const name = item.name.toUpperCase();
        const imageName = item.name.toLowerCase().replace(/\s/g, '');
        const price = Number(item.price).toFixed(2);
        const category = item.category;
        const description = item.description || "No description available.";

        container.innerHTML = `
            <img src="images/items/${imageName}.png" alt="${name}" class="w-80 h-80 object-contain mb-6 rounded-lg shadow-lg" />
            <h1 class="text-2xl font-bold text-gray-800 mb-2">${name}</h1>
            <p class="text-xl text-gray-500 mb-1"><span class="font-medium">${category}</span></p>
            <p class="text-lg font-semibold text-blue-700 mb-4">₪${price}</p>
            <p class="max-w-3xl text-gray-700 text-xl mb-6">${description}</p>
            <div class="flex gap-4">
                <button id="add-btn" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Add to Cart</button>
            </div>
        `;

        // Buttons logic 
        document.getElementById('add-btn').addEventListener('click', () => {
            addToCart(item, 1);
        });

    } catch (error) {
        container.innerHTML = `<p class="text-red-500">Error loading product details.</p>`;
        console.error(err);
    }
});

