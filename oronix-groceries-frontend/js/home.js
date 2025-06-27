let currentIndex = 0;
let visibleItems = 4;
let totalItems = 0;

document.addEventListener("DOMContentLoaded", async () => {
  // helper: if window.config isn't ready yet, wait for the 'configLoaded' event
  function waitForConfig() {
    return window.config
      ? Promise.resolve()
      : new Promise(resolve => window.addEventListener('configLoaded', resolve));
  }
  // Waiting for config to finish loading before calling the API
  await waitForConfig();

  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn.addEventListener("click", function (event) {
    event.preventDefault();
    sessionStorage.clear();
    window.location.href = window.config.app.homePageUrl;
  });

  const track = document.getElementById("categoryTrack");

  try {
    // const res = await fetch("data/oronix_categories.json"); // fetch from local data files
    // const categories = await res.json();

    const categories = await fetchAllCategories();

    totalItems = categories.length;

    categories.forEach(cat => {
      //const cleanName = cat.category_name.trim();
      const cleanName = cat.categoryName.trim();
      const imageName = cleanName.toLowerCase().replace(/\s/g, '');
      const urlParam = encodeURIComponent(cleanName);

      const div = document.createElement("div");
      div.className = "w-1/4 flex-shrink-0 px-2";
      div.innerHTML = `
        <a href="products.html?category=${urlParam}">
          <img src="images/categories/${imageName}.png" alt="${cleanName}" class="rounded-xl object-cover w-full shadow-md hover:scale-105"/>
        </a>
      `;
      track.appendChild(div);
    });

    setInterval(() => scrollCategories(1), 3000);

  } catch (err) {
    console.error("Failed to load categories:", err);
  }
});

function scrollCategories(direction) {
  const track = document.getElementById("categoryTrack");
  const maxIndex = Math.ceil(totalItems / visibleItems) - 1;
  
  currentIndex += direction;
  if (currentIndex < 0) currentIndex = maxIndex;
  if (currentIndex > maxIndex) currentIndex = 0;

  const itemWidth = track.children[0]?.offsetWidth || 0;
  const scrollAmount = currentIndex * itemWidth * visibleItems;

  track.style.transform = `translateX(-${scrollAmount}px)`;
}

async function fetchAllCategories() {
  const fetchAllCategoriesAPI = window.config.api.fetchAllCategories;

  const headers = {
    "Content-Type": "application/json",
    "Authorization": sessionStorage.getItem("tokenId")
  };

  console.log(headers);
  console.log("Fetching Categories from the database.");

  try {
    const response = await fetch(fetchAllCategoriesAPI, {
      method: "GET",
      headers,
      mode: "cors",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const responseBody = await response.json();
    console.log("Categories fetched successfully.", responseBody.data);
    return responseBody.data || [];

  } catch (error) {
    console.error("Error fetching Categories:", error);
    return [];
  }
}

