// auth.js
// This module centralizes all JWT handling logic: extraction, storage, validation and header creation.

// Extracts id_token, and expires_in from the URL hash and saves them to sessionStorage on initial page load.
export function extractAndStoreTokens() {
  // If tokens already exist in sessionStorage, skip extraction
  if (sessionStorage.getItem("id_token")) return;

  // Get the URL fragment (everything after the '#' in the URL)
  const hash = window.location.hash.substring(1); 
  const urlParams = new URLSearchParams(hash);
  
  // Retrieve tokens and expiry information
  const idToken = urlParams.get("id_token"); // The JWT id_token for user authentication
  const tokenExpiresIn = Number(urlParams.get("expires_in")); // Lifetime of the token in seconds (example: 3600)
  const tokenExpiryTimeStamp  = Date.now() + tokenExpiresIn * 1000; // timestamp in milliseconds

  if (idToken) {
    // Store tokens and expiry info in sessionStorage
    sessionStorage.setItem("id_token", idToken);
    sessionStorage.setItem("token_expiry", tokenExpiryTimeStamp.toString());

    // Remove hash from URL to prevent token leakage in browser history
    window.history.replaceState(null, "", window.location.pathname);
  }
}

// Retrieves the stored id_token from sessionStorage.
export function getIdToken() {
  return sessionStorage.getItem("id_token");
}

// Decodes the JWT payload without external libraries.
// Converts Base64Url to Base64, parses JSON, and returns payload object.
function decodeJwtPayload(token) {
  // Extract the payload part of the JWT
  const payloadBase64Url = token.split('.')[1];
  // Replace URL-safe characters and decode Base64
  const payloadBase64 = payloadBase64Url.replace(/-/g,'+').replace(/_/g,'/');
  const jsonPayload = atob(payloadBase64);
  return JSON.parse(jsonPayload);
}

// Checks if the stored id_token has expired based on its 'exp' claim.
export function isTokenExpired() {
  const token = getIdToken();
  if (!token) return true;

  const payload = decodeJwtPayload(token);
  // 'exp' is expressed in seconds since Unix epoch
  return Math.floor(Date.now() / 1000) >= payload.exp;
}

// Returns an object of headers for authenticated fetch requests.
// Includes the id_token in the Authorization header if available.
export function getAuthHeaders() {
  const token = getIdToken();
  return token
    ? { "Authorization": token.trim(), "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

// Ensures that a valid id_token exists before proceeding.
// If missing or expired, redirects the browser to the given login URL.
export function ensureAuthenticated(loginUrl) {
  // Attempt to extract tokens if not already stored
  extractAndStoreTokens();

  // If token is missing or expired, redirect to login
  if (!getIdToken() || isTokenExpired()) {
    window.location.href = loginUrl;
  }
}