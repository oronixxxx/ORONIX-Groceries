const CART_KEY = 'user_cart';

// Function to load the current user cart items from localStorage
const loadCart = () => {
    const cart = localStorage.getItem(CART_KEY);
    return cart ? JSON.parse(cart) : [];
}

// Function to save the current user cart items to localStorage
const saveCart = (cart) => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

let cartItems = loadCart();

// Function to get all items from the cart
export const getCartItems = async() => {
    console.log("Fetching cart items...");
    console.log("Current cart items:", cartItems);
    return cartItems;
}

// Function to add an item to the cart
export const addToCart = async (product, quantity = 1) => {
    const existing = cartItems.find(i => i.id === product.id);

    if (existing) {
        existing.quantity += quantity;
    } else {
        cartItems.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.name.toLowerCase().replace(/\s/g, ''),
            quantity
        });
    }

    saveCart(cartItems);
    console.log(`Added product ${product.name} to cart`);
};

// Function to remove an item from the cart
export const removeFromCart = async(itemId) => {
    if (!cartItems.some(i => i.id === itemId)) {
        console.warn(`Item with ID ${itemId} not found in cart.`);
        return;
    }

    // Filter out the item with the specified ID
    cartItems = cartItems.filter(i => i.id !== itemId);

    saveCart(cartItems);

    console.log(`Item with ID ${itemId} removed from cart.`);
}

// Function to update the quantity of an item in the cart
export const updateCartItemQuantity = async(itemId, quantity) => {  
    const item = cartItems.find(i => i.id === itemId);
    
    if (item) {
        if (quantity <= 0) {
            console.warn(`Quantity must be greater than 0. Removing item ${item.name} from cart.`);
            // If quantity is 0 or less, remove the item from the cart
            removeFromCart(itemId);

            conaole.log(`Item ${item.name} removed from cart due to zero quantity.`);
        } else {
            console.log(`Updating quantity for item ${item.name} to ${quantity}.`);
            
            // Update the quantity of the item
            item.quantity = quantity;
            
            saveCart(cartItems);

            console.log(`Item ${item.name} quantity updated to ${quantity}.`);
        }
    }
}

// Function to clear the cart
export const clearCart = async() => {
    cartItems = [];
    saveCart(cartItems);
}