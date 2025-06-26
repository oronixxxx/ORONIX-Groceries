const CART_KEY = 'user_cart';

const headers = {
    "Content-Type": "application/json",
    "Authorization": sessionStorage.getItem("tokenId")
};

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

    cartItems = await fetchCartItems(); // new

    console.log("Current cart items:", cartItems);
    return cartItems;
}

// Function to add an item to the cart
export const addToCart = async (product, quantity = 1) => {
    // const existing = cartItems.find(i => i.id === product.id);

    // if (existing) {
    //     existing.quantity += quantity;
    // } else {
    //     cartItems.push({
    //         id: product.id,
    //         name: product.name,
    //         price: product.price,
    //         image: product.name.toLowerCase().replace(/\s/g, ''),
    //         quantity
    //     });
    // }

    // saveCart(cartItems);

    await addItemToCart(product.id);
    console.log(`Added product ${product.name} to cart`);
};

// Function to remove an item from the cart
export const removeFromCart = async(itemId) => {
    // if (!cartItems.some(i => i.id === itemId)) {
    //     console.warn(`Item with ID ${itemId} not found in cart.`);
    //     return;
    // }

    // // Filter out the item with the specified ID
    // cartItems = cartItems.filter(i => i.id !== itemId);

    // saveCart(cartItems);
    res = await deleteItemFromCart(itemId);
    if (res) {
      console.log(`Item with ID ${itemId} removed from cart.`);
    }
}

// Function to update the quantity of an item in the cart
export const updateCartItemQuantity = async(itemId, quantity) => {  
    // const item = cartItems.find(i => i.id === itemId);
    
    // if (item) {
    //     if (quantity <= 0) {
    //         console.warn(`Quantity must be greater than 0. Removing item ${item.name} from cart.`);
    //         // If quantity is 0 or less, remove the item from the cart
    //         removeFromCart(itemId);

    //         conaole.log(`Item ${item.name} removed from cart due to zero quantity.`);
    //     } else {
    //         console.log(`Updating quantity for item ${item.name} to ${quantity}.`);
            
    //         // Update the quantity of the item
    //         item.quantity = quantity;
            
    //         saveCart(cartItems);

    //         console.log(`Item ${item.name} quantity updated to ${quantity}.`);
    //     }
    // }

    if (itemId && quantity) {
        if (quantity <= 0) {
            console.warn(`Quantity must be greater than 0. Removing item ${item.name} from cart.`);
            // If quantity is 0 or less, remove the item from the cart
            removeFromCart(itemId);
        } else {
            console.log(`Updating quantity for item ${item.name} to ${quantity}.`);
            
            // Update the quantity of the item
            await updateCartItemQuantity();
        }
    }
}

// Function to clear the cart
export const clearCart = async() => {
    cartItems = [];
    saveCart(cartItems);
}

async function fetchCartItems() {
  const fetchCartItemsAPI = window.config.api.fetchCartItems;

  console.log(headers);
  console.log("Fetching Cart Items from the database...");

  try {
    const response = await fetch(fetchCartItemsAPI, {
      method: "GET",
      headers,
      mode: "cors",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const responseBody = await response.json();
    //console.log("Cart Items fetched successfully.", responseBody.data);
    console.log("Response Message", responseBody.message);
    console.log("Cart Items fetched:", responseBody.data);
    
    return responseBody.data || [];

  } catch (error) {
    console.error("Error fetching Cart Items:", error);
    return [];
  }
}

async function addItemToCart(itemId) {
  const addItemToCartAPI = window.config.api.addItemToCart;

  console.log(headers);
  console.log(`Add Item ${itemId} To Cart -> update database.`);

  let body = {
    "itemId": itemId
  };

  try {
    const response = await fetch(addItemToCartAPI, {
      method: "GET",
      headers,
      mode: "cors",
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const responseBody = await response.json();
    // console.log("Item added to cart successfully.", responseBody.data);
    console.log("Response Message:", responseBody.message, responseBody.data);
    return responseBody.data || [];

  } catch (error) {
    console.error("Error adding item to cart:", error);
    return [];
  }
}

async function deleteItemFromCart(itemId) {
  if (!itemId) return false;

  const deleteItemFromCartAPI = window.config.api.deleteItemFromCart;

  console.log(headers);
  console.log(`Remove Item ${itemId} from cart -> update database.`);

  let body = {
    "itemId" : itemId
  };

  try {
    const response = await fetch(deleteItemFromCartAPI, {
      method: "DELETE",
      headers: headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const responseBody = await response.json();
    console.log(responseBody.message); 
    return true;

  } catch (error) {
    console.error("Error deleting item from cart:", error);
    return false;
  }
}

async function updateCartItemQuantity(itemId, quantity) {
  if (!itemId || !quantity) return false;

  const updateCartItemQuantityAPI = window.config.api.updateCartItemQuantity;

  console.log(headers);
  console.log(`Update Cart: Item ${itemId}, Quantity: ${quantity} -> update database.`);

  let body = {
    "itemId" : itemId,
    "quantity": quantity
  };

  try {
    const response = await fetch(updateCartItemQuantityAPI, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const responseBody = await response.json();
    console.log("Response Message:", responseBody.message, responseBody.data);
    return true;

  } catch (error) {
    console.error("Error updating item quantity:", error);
    return false;
  }
}