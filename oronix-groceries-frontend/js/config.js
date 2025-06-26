// js/config.js
(async function() {
  const STORAGE_KEY = 'appConfig';
  try {
    console.log('Loading config.json from client folder…');

    // Fetch the latest config.json from 
    const response = await fetch('config.json'); // relative to HTML file
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Update global config and save it in window.config & localStorage
    const config = await response.json();
    console.log('config.json:', config);

    window.config = config;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    console.log('Fetched config and saved it');

    // Dispatch the configLoaded event - notify other scripts they can start
    window.dispatchEvent(new Event('configLoaded'));

  } catch (error) {
    console.error('Failed to load config.json:', error);
    // redirect to error page on failure
    // window.location.href = 'error.html';
  }
})();
