// services/cartService.js
import { getAuthHeaders } from '../auth.js';

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
  cartItems = await fetchCartItems();

  console.log("Current cart items:", cartItems);
  saveCart(cartItems);
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
  
  const res = await addItemToCart(Number(product.id));
  if(res){
    console.log(`Added product ${product.name} to cart`);
  }
  return res
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

  const res = await deleteItemFromCart(Number(itemId));
  if (res) {
    console.log(`Item with ID ${itemId} removed from cart.`);
  }
  else {
    console.log(`Removing Item with ID ${itemId} from cart failed.`);
  }
  return res;
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

  // if (itemId && quantity) {
  //   if (quantity <= 0) {
  //     console.warn(`Quantity must be greater than 0. Removing item ${item.name} from cart.`);
  //     // If quantity is 0 or less, remove the item from the cart
  //     removeFromCart(itemId);
  //   } else {
  //     console.log(`Updating quantity for item ${item.name} to ${quantity}.`);
      
  //     // Update the quantity of the item
  //     await updateCartItemQuantityAPI();
  //   }
  // }
  
  // Validate that an itemId was provided.
  if (!itemId) {
    console.warn('updateCartItemQuantity called without itemId');
    return false;
  }

  // Retrieve authentication headers for API calls.
  const headers = getAuthHeaders();
  
  // If quantity is zero or less, remove the item from the cart.
  if (quantity <= 0) {
    console.warn(`Quantity for item ${itemId} is ${quantity} → removing from cart.`);
    // If quantity is 0 or less, remove the item from the cart
    return removeFromCart(Number(itemId));
  }

  // Construct the endpoint URL for updating cart item quantity.
  const updateCartItemQuantityAPI = window.config.api.cart.updateCartItemQuantity;
  console.log(`Updating cart item ${itemId} to quantity ${quantity}`);

  try {
    // Send a PUT request to update the item quantity on the server.
    const response = await fetch(updateCartItemQuantityAPI, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ 
        "itemId": Number(itemId), 
        "quantity": Number(quantity)
      })
    });

    // Throw an error if the response status is not OK (2xx).
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Parse the JSON response from the server.
    const responseBody = await response.json();
    console.log("Response Message:", responseBody.message);
    return true;

  } catch (err) {
    // Log any errors encountered during the update process.
    console.error('Error in updateCartItemQuantity:', err);
    return false;
  }
}

// Function to clear the cart
export const clearCart = () => {
  cartItems = [];
  saveCart(cartItems);
}

async function fetchCartItems() {
  // Construct the endpoint URL
  const fetchCartItemsAPI = window.config.api.cart.fetchCartItems;
  // Retrieve authentication headers for API calls.
  const headers = getAuthHeaders();

  console.log("Fetching Cart Items from the database...");

  try {
    const response = await fetch(fetchCartItemsAPI, {
      method: "GET",
      headers,
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
  // Validate that an itemId was provided.
  if (!itemId) {
    console.warn('addItemToCart called without itemId');
    return false;
  }

  // Construct the endpoint URL
  const addItemToCartAPI = window.config.api.cart.addItemToCart;
  // Retrieve authentication headers for API calls.
  const headers = getAuthHeaders();

  console.log(`Add Item ${itemId} To Cart -> update database.`);

  try {
    const response = await fetch(addItemToCartAPI, {
      method: "POST",
      headers,
      body: JSON.stringify({ itemId })   // body = { "itemId": itemId };
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const responseBody = await response.json();
    // console.log("Item added to cart successfully.", responseBody.data);
    console.log("Response Message:", responseBody.message, responseBody.data);
    return true;

  } catch (error) {
    console.error("Error adding item to cart:", error);
    return false;
  }
}

async function deleteItemFromCart(itemId) {
  // Validate that an itemId was provided.
  if (!itemId) {
    console.warn('deleteItemFromCart called without itemId');
    return false;
  }

  console.log(`Remove Item ${itemId} from cart.`);
  // Construct the endpoint URL
  const deleteItemFromCartAPI = window.config.api.cart.deleteItemFromCart;
  // Retrieve authentication headers for API calls.
  const headers = getAuthHeaders();

  // let body = {
  //   "itemId" : itemId
  // };

  try {
    const response = await fetch(deleteItemFromCartAPI, {
      method: "DELETE",
      headers,
      body: JSON.stringify({ itemId })
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

// async function updateCartItemQuantityAPI(itemId, quantity) {
//   if (!itemId || !quantity) return false;

//   const updateCartItemQuantityAPI = window.config.api.updateCartItemQuantity;

//   console.log(headers);
//   console.log(`Update Cart: Item ${itemId}, Quantity: ${quantity} -> update database.`);

//   let body = {
//     "itemId" : itemId,
//     "quantity": quantity
//   };

//   try {
//     const response = await fetch(updateCartItemQuantityAPI, {
//       method: "PUT",
//       headers: headers,
//       body: JSON.stringify(body)
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP error! Status: ${response.status}`);
//     }

//     const responseBody = await response.json();
//     console.log("Response Message:", responseBody.message, responseBody.data);
//     return true;

//   } catch (error) {
//     console.error("Error updating item quantity:", error);
//     return false;
//   }
// }