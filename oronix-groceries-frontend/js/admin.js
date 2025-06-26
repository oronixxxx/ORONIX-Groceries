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

d// Replace with your actual API Gateway URLs
const ADD_ITEM_API = 'https://njbrrbrikd.execute-api.us-east-1.amazonaws.com/dev/admin/add-item';
const DELETE_ITEM_API = 'https://njbrrbrikd.execute-api.us-east-1.amazonaws.com/dev/admin/remove-item';
const FETCH_ITEMS_API = 'https://njbrrbrikd.execute-api.us-east-1.amazonaws.com/dev/items';
const FETCH_COLORS_API = 'https://njbrrbrikd.execute-api.us-east-1.amazonaws.com/dev/colors';
const FETCH_CATEGORIES_API = 'https://njbrrbrikd.execute-api.us-east-1.amazonaws.com/dev/categories';

// Fetch all items and display them in a table
async function fetchItemsAndDisplay() {
  try {
    const response = await fetch(FETCH_ITEMS_API);
    const result = await response.json();
    const items = result.data || [];

    const tableBody = document.getElementById('item-table-body');
    tableBody.innerHTML = '';

    items.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.id}</td>
        <td>${item.name}</td>
        <td>${item.price}</td>
        <td>${item.category}</td>
        <td>${item.color}</td>
        <td>${item.description || ''}</td>
        <td>
          <button class="delete-btn text-red-500 underline" data-id="${item.id}">Delete</button>
        </td>
      `;
      tableBody.appendChild(row);
    });

    // Attach delete handlers
    document.querySelectorAll('.delete-btn').forEach(button => {
      button.addEventListener('click', async () => {
        const itemId = button.dataset.id;
        if (!confirm(`Are you sure you want to delete item ${itemId}?`)) return;

        try {
          const res = await fetch(DELETE_ITEM_API, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': localStorage.getItem('token') || ''
            },
            body: JSON.stringify({ id: parseInt(itemId) })
          });
          const result = await res.json();
          alert(result.message);
          fetchItemsAndDisplay(); // Refresh table
        } catch (err) {
          alert('Failed to delete item: ' + err.message);
        }
      });
    });
  } catch (err) {
    alert('Failed to load items: ' + err.message);
  }
}

// Handle add item form submission
document.getElementById('add-item-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('item-name').value.trim();
  const price = parseFloat(document.getElementById('item-price').value);
  const category = document.getElementById('item-category').value;
  const color = document.getElementById('item-color').value;
  const description = document.getElementById('item-description').value;

  try {
    const res = await fetch(ADD_ITEM_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token') || ''
      },
      body: JSON.stringify({
        name,
        price,
        category,
        color,
        description
      })
    });

    const result = await res.json();
    alert(result.message);
    fetchItemsAndDisplay();
    e.target.reset();
  } catch (err) {
    alert('Failed to add item: ' + err.message);
  }
});

// Load items on page load
document.addEventListener('DOMContentLoaded', fetchItemsAndDisplay);
