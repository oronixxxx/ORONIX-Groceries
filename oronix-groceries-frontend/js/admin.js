/* let localItems = [];
let categories = [];
let colors = [];

const tableBody = document.getElementById('item-table-body');
const form = document.getElementById('add-item-form');
const toggleBtn = document.getElementById('toggle-add-form');
const tableContainer = document.querySelector('table').parentElement;
const categorySelect = document.getElementById('category-select');
const colorSelect = document.getElementById('color-select');

// Load categories and colors first
Promise.all([
  fetch('data/oronix_categories.json').then(res => res.json()),
  fetch('data/oronix_colors.json').then(res => res.json())
]).then(([categoryData, colorData]) => {
  categories = categoryData;
  colors = colorData;

    // Populate dropdowns in the form (with default option first)
    categorySelect.innerHTML = `<option value="" disabled selected>Select category</option>` +
    categories.map(cat => `<option value="${cat.category_name}">${cat.category_name}</option>`).join('');

    colorSelect.innerHTML = `<option value="" disabled selected>Select color</option>` +
    colors.map(c => `<option value="${c.category_name}">${c.category_name}</option>`).join('');

  // Load items after dropdowns are ready
  return fetch('data/oronix_items.json');
}).then(res => res.json())
  .then(data => {
    localItems = [...data];
    renderItems();
  }).catch(err => console.error('Error loading data:', err));

// Render the items in the table
function renderItems() {
  tableBody.innerHTML = '';
  localItems.forEach((item, index) => {
    const imageName = item.name.toLowerCase().replace(/\s/g, '');

    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="border px-4 py-2 border-blue-300">
        <img src="images/items/${imageName}.png" class="w-10 h-10 object-contain rounded-lg" alt="${item.name}" />
      </td>
      <td class="border px-4 py-2 border-blue-300">
        <input type="text" value="${item.name}" class="editable border rounded px-1 w-full" data-field="name" data-index="${index}" />
      </td>
      <td class="border px-4 py-2 border-blue-300">
        <input type="number" value="${item.price}" class="editable border rounded px-1 w-full" data-field="price" data-index="${index}" />
      </td>
      <td class="border px-4 py-2 border-blue-300">
        <select class="editable border rounded px-1 w-full" data-field="category" data-index="${index}">
          ${categories.map(cat => `
            <option value="${cat.category_name}" ${cat.category_name === item.category ? 'selected' : ''}>${cat.category_name}</option>
          `).join('')}
        </select>
      </td>
      <td class="border px-4 py-2 border-blue-300">
        <select class="editable border rounded px-1 w-full" data-field="color" data-index="${index}">
          ${colors.map(c => `
            <option value="${c.category_name}" ${c.category_name === item.color ? 'selected' : ''}>${c.category_name}</option>
          `).join('')}
        </select>
      </td>
      <td class="border px-4 py-2 border-blue-300">
        <button class="text-red-600 hover:underline" data-action="delete" data-index="${index}">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// Edit item
tableBody.addEventListener('input', (e) => {
  const input = e.target;
  const index = input.dataset.index;
  const field = input.dataset.field;
  localItems[index][field] = field === 'price' ? parseFloat(input.value) : input.value;
});

// Delete item
tableBody.addEventListener('click', (e) => {
  if (e.target.dataset.action === 'delete') {
    localItems.splice(e.target.dataset.index, 1);
    renderItems();
  }
});

// Toggle add form
toggleBtn.addEventListener('click', () => {
  const isHidden = form.classList.contains('hidden');
  form.classList.toggle('hidden', !isHidden);
  tableContainer.classList.toggle('hidden', isHidden);
});

// Add item
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const itemName = formData.get('name')?.trim();

  const newItem = {
    name: itemName,
    price: parseFloat(formData.get('price')),
    category: formData.get('category'),
    color: formData.get('color'),
    image: itemName.toLowerCase().replace(/\s/g, ''),
    description: formData.get('description'),
  };

  localItems.push(newItem);
  form.reset();
  form.classList.add('hidden');
  tableContainer.classList.remove('hidden');
  renderItems();
}); */

let allItems = []; 

// Load config.json and store it globally
fetch('./config.json')
  .then(res => res.json())
  .then(data => {
    window.config = data;
    window.dispatchEvent(new Event('configLoaded'));
  });

// Helper: wait for config to be available before proceeding
function waitForConfig() {
  return window.config
    ? Promise.resolve()
    : new Promise(resolve => window.addEventListener('configLoaded', resolve));
}

// Main app logic
waitForConfig().then(() => {
  const categoryEndpoint = window.config.api.fetchAllCategories;
  const colorEndpoint = window.config.api.fetchAllColors;
  const itemsEndpoint = window.config.api.fetchAllItems;
  const addItemEndpoint = window.config.api.admin.addItemToInventory;
  const removeItemEndpoint = window.config.api.admin.deleteFromInventory;

  const tableBody = document.getElementById('item-list');
  const form = document.getElementById('add-item-form');
  const toggleBtn = document.getElementById('toggle-add-form');
  const categorySelect = document.getElementById('category-select');
  const colorSelect = document.getElementById('color-select');

  toggleBtn.addEventListener('click', () => {
    const isHidden = form.classList.toggle('hidden');
    tableBody.classList.toggle('hidden');

    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.classList.toggle('hidden');

    toggleBtn.textContent = isHidden ? 'Add' : 'Cancel';
  });

  // Load categories and colors
  Promise.all([
    fetch(categoryEndpoint).then(res => res.json()),
    fetch(colorEndpoint).then(res => res.json())
  ]).then(([categoryData, colorData]) => {
    const categories = categoryData.data || [];
    const colors = colorData.data || [];

    categorySelect.innerHTML = categories.map(cat =>
      `<option value="${cat.categoryName}">${cat.categoryName}</option>`
    ).join('');

    colorSelect.innerHTML = colors.map(color =>
      `<option value="${color.colorName}">${color.colorName}</option>`
    ).join('');
  });

  // Load items and display them
  function loadItems() {
    fetch(itemsEndpoint)
      .then(res => res.json())
      .then(data => {
        allItems = data.data || [];
        renderItems(allItems);
      });
  }

  // Filter items
  function filterItems(query) {
    const lower = query.toLowerCase();
    const filtered = allItems.filter(item =>
      item.name.toLowerCase().includes(lower)
    );
    renderItems(filtered);
  }

  document.getElementById('search-input').addEventListener('input', (e) => {
    filterItems(e.target.value);
  });

  function renderItems(items) {
    tableBody.innerHTML = items.map(item => {
      const fileName = item.name.toLowerCase().replace(/\s/g, '');

      return `
        <div class="flex items-start justify-between border rounded-lg p-4 shadow bg-white">
          <div class="flex items-start gap-4 text-left">
            <img
              src="images/items/${fileName}.png"
              onerror="this.onerror=null; this.src='images/logo.png';"
              alt="${item.name}"
              class="w-20 h-20 object-contain rounded-lg"
            />  
            <div>
              <h3 class="font-semibold text-lg text-gray-800 mb-1">${item.name}</h3>
              <p class="text-sm text-gray-600 mb-1">${item.description || ''}</p>
              <p class="text-sm text-gray-700 font-medium">Price: ₪${item.price}</p>
              <p class="text-sm text-gray-600">Category: ${item.category} | Color: ${item.color}</p>
            </div>
          </div>
          <button class="bg-red-500 text-white px-3 py-1 rounded h-fit mt-2 delete-btn" data-id="${item.id}">
            Delete
          </button>
        </div>
      `;
    }).join('');

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        deleteItem(id);
      });
    });
  }
  // Handle item deletion
  function deleteItem(id) {
    fetch(removeItemEndpoint, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    }).then(res => res.json())
      .then(() => {
        loadItems(); // Refresh list
      });
  }

  // Handle add item form
  form.addEventListener('submit', e => {
    e.preventDefault();

    const formData = new FormData(form);
    const item = {
      name: formData.get('name'),
      price: parseFloat(formData.get('price')),
      category: formData.get('category'),
      color: formData.get('color'),
      description: formData.get('description')
    };

    fetch(addItemEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    })
      .then(res => res.json())
      .then(() => {
        form.reset();
        form.classList.toggle('hidden');
        tableBody.classList.toggle('hidden');
        loadItems(); // Refresh list
      });
  });

  // Initial load
  loadItems();
});
