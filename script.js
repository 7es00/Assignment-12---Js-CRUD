const form = document.getElementById('crudForm');
const tableBody = document.getElementById('productTable');
const emptyMsg = document.getElementById('emptyMessage');
const searchInput = document.getElementById('searchInput');
const sortBtn = document.getElementById('sortBtn');

let products = [];
let editId = null;
let sortAsc = true;

//  Reset form on loading
window.addEventListener('DOMContentLoaded', () => {
  form.reset();
  clearValidation();
});
form.querySelectorAll('.form-control, .form-select').forEach(input => {
  input.addEventListener('input', () => {
    input.classList.remove('is-invalid');
  });
});

form.addEventListener('submit', e => {
  e.preventDefault();
  if (!validateForm()) return;

  const product = buildProduct();
  if (editId === null) {
    product.id = Date.now();
    products.push(product);
  } else {
    product.id = editId;
    const index = products.findIndex(p => p.id === editId);
    products[index] = product;
    editId = null;
    toggleButtons('add');
  }
  form.reset();
  clearValidation();
  renderTable();
});

form.addEventListener('reset', () => {
  editId = null;
  toggleButtons('add');
  clearValidation();
});

document.getElementById('updateBtn').addEventListener('click', () => form.requestSubmit());
searchInput.addEventListener('input', renderTable);
sortBtn.addEventListener('click', () => {
  sortAsc = !sortAsc;
  sortBtn.textContent = `Sort by Price ${sortAsc ? '↑' : '↓'}`;
  renderTable();
});

//  Build product object from form
function buildProduct() {
  const file = form.productImage.files[0];
  const imageUrl = file ? URL.createObjectURL(file) : products.find(p => p.id === editId)?.image;
  return {
    name: form.productName.value.trim(),
    price: +form.productPrice.value,
    category: form.productCategory.value,
    description: form.productDescription.value.trim(),
    image: imageUrl
  };
}

// Validate form inputs
function validateForm() {
  let valid = true;

  const img = form.productImage.files[0];
  if (editId === null && !img) {
    setInvalid('productImage');
    valid = false;
  } else if (img) {
    if (!['image/jpeg', 'image/png'].includes(img.type) || img.size > 2 * 1024 * 1024) {
      setInvalid('productImage', 'Image must be JPG/PNG and ≤ 2MB.');
      valid = false;
    } else clearInvalid('productImage');
  } else clearInvalid('productImage');

  if (!form.productName.value.trim()) {
    setInvalid('productName'); valid = false;
  } else clearInvalid('productName');

  const price = +form.productPrice.value;
  if (price < 6000 || price > 60000) {
    setInvalid('productPrice'); valid = false;
  } else clearInvalid('productPrice');

  const category = form.productCategory.value;
  if (!['Electronics', 'Furniture', 'Clothing'].includes(category)) {
    setInvalid('productCategory'); valid = false;
  } else clearInvalid('productCategory');

  const desc = form.productDescription.value.trim();
  if (!desc || desc.length > 250) {
    setInvalid('productDescription'); valid = false;
  } else clearInvalid('productDescription');

  return valid;
}

function setInvalid(id, message = null) {
  const el = document.getElementById(id);
  el.classList.add('is-invalid');
  if (message) el.nextElementSibling.textContent = message;
}

function clearInvalid(id) {
  document.getElementById(id).classList.remove('is-invalid');
}

function clearValidation() {
  form.querySelectorAll('.form-control, .form-select').forEach(el => {
    el.classList.remove('is-invalid');
  });
}

//  show table with  search & highlighting
function renderTable() {
  const term = searchInput.value.trim().toLowerCase();
  let filtered = products.filter(p =>
    p.name.toLowerCase().includes(term) ||
    p.category.toLowerCase().includes(term) ||
    p.description.toLowerCase().includes(term)
  );

  if (term) {
    filtered.forEach(p => {
      ['name', 'category', 'description'].forEach(field => {
        const regex = new RegExp(`(${term})`, 'gi');
        p[field + '_hl'] = p[field].replace(regex, '<span class="highlight">$1</span>');
      });
    });
  }

  if (filtered.length === 0) {
    tableBody.innerHTML = '';
    emptyMsg.textContent = products.length ? 'No products match your search.' : 'No products added yet.';
    emptyMsg.classList.remove('d-none');
    return;
  }

  emptyMsg.classList.add('d-none');
  filtered.sort((a, b) => sortAsc ? a.price - b.price : b.price - a.price);

  tableBody.innerHTML = filtered.map((p, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><img src="${p.image}" width="50"/></td>
      <td>${p.name_hl || p.name}</td>
      <td>${p.price.toLocaleString()}</td>
      <td>${p.category_hl || p.category}</td>
      <td>${p.description_hl || p.description}</td>
      <td>
        <button class="btn btn-sm btn-warning me-1" onclick="startEdit(${p.id})">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteProd(${p.id})">Delete</button>
      </td>
    </tr>
  `).join('');
}

//  Edit button logic
window.startEdit = (id) => {
  const p = products.find(prod => prod.id === id);
  if (!p) return;

  editId = id;
  form.productName.value = p.name;
  form.productPrice.value = p.price;
  form.productCategory.value = p.category;
  form.productDescription.value = p.description;

  toggleButtons('update');
};

// Delete button logic
window.deleteProd = (id) => {
  if (!confirm('Are you sure you want to delete this product?')) return;
  products = products.filter(p => p.id !== id);
  renderTable();
};

// Toggle buttons
function toggleButtons(mode) {
  document.getElementById('addBtn').classList.toggle('d-none', mode === 'update');
  document.getElementById('updateBtn').classList.toggle('d-none', mode === 'add');
}

// Initial render
renderTable();
