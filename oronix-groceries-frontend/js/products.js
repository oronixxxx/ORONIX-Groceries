document.addEventListener("DOMContentLoaded", async () => {
  const productGrid = document.getElementById("product-grid");
  const pagination = document.getElementById("pagination");
  const categoryContainer = document.querySelector("ul.space-y-2");
  const colorContainer = document.querySelector("aside .grid.grid-cols-3");
  const searchInput = document.querySelector("input[placeholder='Search for items...']");
  const itemsPerPage = 15;
  let currentPage = 1;
  let allItems = [];
  let filteredItems = [];
  let selectedCategories = [];
  let selectedColors = [];
  let searchQuery = "";

  // helper: if window.config isn't ready yet, wait for the 'configLoaded' event
  function waitForConfig() {
    return window.config
      ? Promise.resolve()
      : new Promise(resolve => window.addEventListener('configLoaded', resolve));
  }
  // Waiting for config to finish loading before calling the API
  await waitForConfig();

  try {
    // const [itemsRes, categoriesRes] = await Promise.all([
    //   fetch("data/oronix_items.json"),
    //   fetch("data/oronix_categories.json")
    // ]);
    // const items = await itemsRes.json();
    // const categories = await categoriesRes.json();

    const items = await fetchAllItems();
    const categories = await fetchAllCategories();

    allItems = items;
    filteredItems = items;
    // --- Render Categories ---
    categoryContainer.innerHTML = "";
    categories.forEach(cat => {
      const cleanName = cat.categoryName.trim();
      const checkbox = document.createElement("li");
      checkbox.innerHTML = `<input type="checkbox" class="mr-2 ml-6" value="${cleanName}">${cleanName}`;
      categoryContainer.appendChild(checkbox);
    });

    // --- Check for initial category from URL ---
    const urlParams = new URLSearchParams(window.location.search);
    const initialCategory = urlParams.get("category");
    if (initialCategory) {
      const normalized = normalizeCategory(initialCategory);
      selectedCategories = [normalized];

      // Check the relevant checkbox
      const checkbox = Array.from(categoryContainer.querySelectorAll("input[type='checkbox']"))
        .find(cb => normalizeCategory(cb.value) === normalized);
      if (checkbox) checkbox.checked = true;

      applyFilters(); // apply the filter with initial category
    }

    // --- Render Colors from JSON ---
    const colorSet = new Set(items.map(i => i.color.toLowerCase()));
    
    colorContainer.innerHTML = "";
    colorSet.forEach(color => {
      const span = document.createElement("span");
      span.className = "w-17 h-8 rounded-full block border border-gray-900 cursor-pointer bg-cover bg-center";
      span.style.backgroundImage = `url(${getColorImageFromName(color)})`;
      span.setAttribute("data-color", color);
      colorContainer.appendChild(span);
    });


    // --- Filtering Events ---
    function normalizeCategory(cat) {
      return cat.toLowerCase().replace(/\s+/g, '');
    }

    categoryContainer.addEventListener("change", () => {
      const checkedBoxes = categoryContainer.querySelectorAll("input[type='checkbox']:checked");
      selectedCategories = Array.from(checkedBoxes).map(cb => normalizeCategory(cb.value));
      applyFilters();
    });

    colorContainer.addEventListener("click", (e) => {
      const color = e.target.dataset.color;
      if (!color) return;

      const index = selectedColors.indexOf(color);
      if (index === -1) {
        selectedColors.push(color); 
        e.target.classList.add("ring", "ring-blue-400"); 
      } else {
        selectedColors.splice(index, 1);
        e.target.classList.remove("ring", "ring-blue-400");
      }

      applyFilters();
    });

    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      applyFilters();
    });

    function applyFilters() {
      filteredItems = allItems.filter(item => {
        const normalizedCat = normalizeCategory(item.category);
        const matchCategory = selectedCategories.length
          ? selectedCategories.includes(normalizedCat)
          : true;
        const matchColor = selectedColors.length
          ? selectedColors.includes(item.color.toLowerCase())
          : true; 
        const matchSearch = searchQuery
          ? item.name.toLowerCase().includes(searchQuery) || normalizedCat.includes(searchQuery)
          : true;
        return matchCategory && matchColor && matchSearch;
      });

      currentPage = 1;
      renderPage(currentPage);
      updatePagination();
    }


    function renderPage(page) {
      productGrid.innerHTML = "";
      const start = (page - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      const itemsToShow = filteredItems.slice(start, end);

      itemsToShow.forEach(item => {
        const card = document.createElement("div");
        card.className = "product-card rounded-xl shadow-md overflow-hidden text-center bg-white hover:shadow-xl transition";
        card.setAttribute("data-id", item.id);
        card.setAttribute("data-category", item.category);
        card.setAttribute("data-price", item.price);
        card.setAttribute("data-color", item.color.toLowerCase());

        const name = item.name[0].toUpperCase() + item.name.slice(1);
        const imageName = item.name.toLowerCase().replace(/\s/g, '');

        card.innerHTML = `
          <a href="product.html?id=${item.id}">
            <img src="images/items/${imageName}.png" alt="${name}" class="object-cover w-full h-40 rounded-t-xl">
            <div class="p-2 font-medium text-gray-800">${name}</div>
          </a>
        `;

        productGrid.appendChild(card);
      });

      const noResults = document.getElementById("no-results");
      if (itemsToShow.length === 0) {
        noResults?.classList.remove("hidden");
      } else {
        noResults?.classList.add("hidden");
      }
    }

    function updatePagination() {
      pagination.innerHTML = "";
      const pageCount = Math.ceil(filteredItems.length / itemsPerPage);

      const maxVisible = 5;
      let start = Math.max(currentPage - Math.floor(maxVisible / 2), 1);
      let end = Math.min(start + maxVisible - 1, pageCount);

      if (end - start < maxVisible - 1) {
        start = Math.max(end - maxVisible + 1, 1);
      }

      if (start > 1) pagination.appendChild(createEllipsis());

      for (let i = start; i <= end; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        btn.className = "px-4 py-1 rounded-full border text-sm font-medium hover:bg-blue-200 transition";
        if (i === currentPage) btn.classList.add("bg-blue-400", "text-white");

        btn.addEventListener("click", () => {
          currentPage = i;
          renderPage(currentPage);
          updatePagination();
        });

        pagination.appendChild(btn);
      }

      if (end < pageCount) pagination.appendChild(createEllipsis());
    }

    function createEllipsis() {
      const ellipsis = document.createElement("span");
      ellipsis.textContent = "...";
      ellipsis.className = "px-4 py-1 text-gray-400";
      return ellipsis;
    }

    function getColorImageFromName(color) {
      const imageMap = {
        red: "images/colors/red.png",
        yellow: "images/colors/yellow.png",
        orange: "images/colors/orange.png",
        green: "images/colors/green.png",
        pink: "images/colors/pink.png",
        white: "images/colors/white.png",
        brown: "images/colors/brown.png",
        blue: "images/colors/blue.png",
        colorful: "images/colors/colorful.png",
        purple: "images/colors/purple.png",
        blue: "images/colors/blue.png"
      };
      return imageMap[color] || "";
    }

    renderPage(currentPage);
    updatePagination();

  } catch (err) {
    console.error("Failed to load data:", err);
  }
});

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

async function fetchAllItems() {
  const fetchAllItemsAPI = window.config.api.fetchAllItems;
  
  const headers = {
    "Content-Type": "application/json",
    "Authorization": sessionStorage.getItem("tokenId")
  };
  
  console.log(headers);
  console.log("Fetching All Items from the database.");

  try {
    const response = await fetch(fetchAllItemsAPI, {
      method: "GET",
      headers,
      mode: "cors",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const responseBody = await response.json();
    console.log("Items fetched successfully.", responseBody.data);
    return responseBody.data || [];

  } catch (error) {
    console.error("Error fetching Items:", error);
    return [];
  }
}