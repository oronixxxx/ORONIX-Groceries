import { addToCart, removeFromCart, getCartItems, updateCartItemQuantity } from './services/cartService.js';

document.addEventListener('DOMContentLoaded', async () => {
    const cartContainer = document.getElementById('cart-items');

    try {
        let cartItems = await getCartItems();
        renderCartItems(cartItems);
        updateTotalPrice(cartItems);

    } catch (error) {
        console.error('Error loading cart:', error);
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

        itemElement.innerHTML = `
            <div class="flex flex-row items-center justify-between w-70 gap-20">
                <div class="flex flex-col items-center">
                    <img src="images/items/${item.image}.png" alt="${item.name}" class="flex justify-center w-32 h-32 object-cover rounded-lg mr-4">
                </div>
                <div class="flex flex-col items-center w-40 gap-4">
                    <h3 class="text-4xl font-semibold flex items-center">${item.name}</h3>
                    <p class="text-blue-500 items-center text-xl">₪${(item.price * item.quantity).toFixed(2)}</p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <input type="number" value="${item.quantity}" min="1" class="quantity-input w-28 h-10 text-center border rounded-lg">
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