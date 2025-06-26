import { getCartItems, clearCart } from './services/cartService.js';

document.addEventListener('DOMContentLoaded', () => {
    loadCartItems();

    document.getElementById('checkout-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await placeOrder(); // mock order now, real later
    });
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
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        // Build image path based on item name (you can adjust this logic as needed)
        const imageName = item.name.toLowerCase().replace(/\s/g, '');
        const imagePath = `images/items/${imageName}.png`;

        container.innerHTML += `
            <div class="flex items-center justify-between border-b pb-3 gap-4">
                <div class="flex items-center gap-3">
                    <img src="${imagePath}" alt="${item.name}" class="w-12 h-12 object-contain rounded" />
                    <span class="text-gray-700"><span class="font-bold">${item.name}</span> x ${item.quantity}</span>
                </div>
                <span class="font-medium text-blue-600">₪${itemTotal.toFixed(2)}</span>
            </div>
        `;
    });

    totalPriceElement.textContent = `Total price: ₪${total.toFixed(2)}`;
}

async function placeOrder() {
    const form = document.getElementById('checkout-form');
    const formData = new FormData(form);
    const order = {
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        city: formData.get('city'),
        state: formData.get('state'),
        zip: formData.get('zip'),
        items: await getCartItems()
    };

    // Here should be the logic to aws
    console.log('Placing order...', order);

    alert('Order placed successfully!\n(Stored in console for mock)');
    clearCart();
    window.location.href = 'thankyou.html';
}