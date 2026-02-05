// main.js
// Product Dashboard logic

let productsData = [];
let filteredData = [];
let currentPage = 1;
let pageSize = 5;
let sortTitleAsc = true;
let sortPriceAsc = true;
let selectedProduct = null;

document.addEventListener('DOMContentLoaded', function() {
  const tbody = document.getElementById('product-table-body');
  const searchInput = document.getElementById('search-input');
  const pageSizeSelect = document.getElementById('page-size');
  const pagination = document.getElementById('pagination');
  const sortTitleBtn = document.getElementById('sort-title');
  const sortPriceBtn = document.getElementById('sort-price');
  const exportCsvBtn = document.getElementById('export-csv');
  const detailModal = new bootstrap.Modal(document.getElementById('detailModal'));
  const editModal = new bootstrap.Modal(document.getElementById('editModal'));
  const createModal = new bootstrap.Modal(document.getElementById('createModal'));
  const editForm = document.getElementById('editForm');
  const createForm = document.getElementById('createForm');
  const editItemBtn = document.getElementById('editItemBtn');

  function renderTable(data) {
    tbody.innerHTML = '';
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageData = data.slice(start, end);
    pageData.forEach(product => {
      const row = document.createElement('tr');
      row.title = product.description || '';
      row.style.cursor = 'pointer';
      row.innerHTML = `
        <td>${product.id}</td>
        <td>${product.title}</td>
        <td>$${product.price}</td>
        <td>${product.category?.name || ''}</td>
        <td>
          ${product.images && product.images.length > 0
            ? `<img src="${product.images[0]}" alt="Image" style="width:60px;height:60px;object-fit:cover;">`
            : ''}
        </td>
      `;
      row.onclick = function() {
        selectedProduct = product;
        showDetailModal(product);
      };
      tbody.appendChild(row);
    });
  }

  function renderPagination(data) {
    pagination.innerHTML = '';
    const totalPages = Math.ceil(data.length / pageSize);
    for (let i = 1; i <= totalPages; i++) {
      const li = document.createElement('li');
      li.className = 'page-item' + (i === currentPage ? ' active' : '');
      const a = document.createElement('a');
      a.className = 'page-link';
      a.href = '#';
      a.textContent = i;
      a.onclick = function(e) {
        e.preventDefault();
        currentPage = i;
        updateView();
      };
      li.appendChild(a);
      pagination.appendChild(li);
    }
  }

  function updateView() {
    renderTable(filteredData);
    renderPagination(filteredData);
  }

  function showDetailModal(product) {
    document.getElementById('detailModalBody').innerHTML = `
      <strong>ID:</strong> ${product.id}<br>
      <strong>Title:</strong> ${product.title}<br>
      <strong>Price:</strong> $${product.price}<br>
      <strong>Description:</strong> ${product.description}<br>
      <strong>Category:</strong> ${product.category?.name || ''}<br>
      <strong>Images:</strong><br>
      ${product.images && product.images.length > 0 ? `<img src="${product.images[0]}" style="width:120px;height:120px;object-fit:cover;">` : ''}
    `;
    detailModal.show();
  }

  editItemBtn.addEventListener('click', function() {
    if (!selectedProduct) return;
    document.getElementById('editModalBody').innerHTML = `
      <div class="mb-3">
        <label class="form-label">Title</label>
        <input type="text" class="form-control" id="edit-title" value="${selectedProduct.title}" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Price</label>
        <input type="number" class="form-control" id="edit-price" value="${selectedProduct.price}" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Description</label>
        <textarea class="form-control" id="edit-description" required>${selectedProduct.description}</textarea>
      </div>
      <div class="mb-3">
        <label class="form-label">Category ID</label>
        <input type="number" class="form-control" id="edit-category" value="${selectedProduct.category?.id || ''}" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Image URL</label>
        <input type="text" class="form-control" id="edit-image" value="${selectedProduct.images[0] || ''}" required>
      </div>
    `;
    editModal.show();
  });

  editForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if (!selectedProduct) return;
    const updatedProduct = {
      title: document.getElementById('edit-title').value,
      price: parseFloat(document.getElementById('edit-price').value),
      description: document.getElementById('edit-description').value,
      categoryId: parseInt(document.getElementById('edit-category').value),
      images: [document.getElementById('edit-image').value]
    };
    fetch(`https://api.escuelajs.co/api/v1/products/${selectedProduct.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProduct)
    })
    .then(res => res.json())
    .then(data => {
      // Update local data
      const idx = productsData.findIndex(p => p.id === selectedProduct.id);
      if (idx !== -1) {
        productsData[idx] = { ...productsData[idx], ...updatedProduct, category: { id: updatedProduct.categoryId, name: productsData[idx].category?.name || '' } };
      }
      filteredData = productsData;
      updateView();
      editModal.hide();
      detailModal.hide();
    });
  });

  createForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const newProduct = {
      title: document.getElementById('create-title').value,
      price: parseFloat(document.getElementById('create-price').value),
      description: document.getElementById('create-description').value,
      categoryId: parseInt(document.getElementById('create-category').value),
      images: [document.getElementById('create-image').value]
    };
    fetch('https://api.escuelajs.co/api/v1/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct)
    })
    .then(res => res.json())
    .then(data => {
      // Đảm bảo có category và images để không bị undefined khi render
      if (!data.category) data.category = { id: newProduct.categoryId, name: '' };
      if (!data.images || !Array.isArray(data.images) || data.images.length === 0) data.images = newProduct.images;
      productsData.unshift(data);
      filteredData = productsData;
      updateView();
      createModal.hide();
      createForm.reset();
    });
  });

  exportCsvBtn.addEventListener('click', function() {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageData = filteredData.slice(start, end);
    let csv = 'ID,Title,Price,Category,Images\n';
    pageData.forEach(product => {
      csv += `${product.id},"${product.title}",${product.price},"${product.category?.name || ''}","${product.images[0] || ''}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'products.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  fetch('https://api.escuelajs.co/api/v1/products')
    .then(response => response.json())
    .then(products => {
      productsData = products;
      filteredData = productsData;
      updateView();
    });

  searchInput.addEventListener('input', function() {
    const keyword = this.value.toLowerCase();
    filteredData = productsData.filter(product =>
      product.title.toLowerCase().includes(keyword)
    );
    currentPage = 1;
    updateView();
  });

  pageSizeSelect.addEventListener('change', function() {
    pageSize = parseInt(this.value);
    currentPage = 1;
    updateView();
  });

  sortTitleBtn.addEventListener('click', function() {
    filteredData.sort((a, b) => {
      if (a.title < b.title) return sortTitleAsc ? -1 : 1;
      if (a.title > b.title) return sortTitleAsc ? 1 : -1;
      return 0;
    });
    sortTitleAsc = !sortTitleAsc;
    currentPage = 1;
    updateView();
  });

  sortPriceBtn.addEventListener('click', function() {
    filteredData.sort((a, b) => sortPriceAsc ? a.price - b.price : b.price - a.price);
    sortPriceAsc = !sortPriceAsc;
    currentPage = 1;
    updateView();
  });
});