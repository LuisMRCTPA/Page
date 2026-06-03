// Admin Functionality
let salesChart = null;

// Check admin access
function checkAdminAccess() {
    const user = getCurrentUser();
    if (!user || user.rol !== 'admin') {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Load Dashboard
function loadDashboard() {
    const users = JSON.parse(localStorage.getItem('petcare_users') || '[]');
    const products = JSON.parse(localStorage.getItem('petcare_products') || '[]');
    const orders = JSON.parse(localStorage.getItem('petcare_orders') || '[]');
    
    const totalUsers = users.length;
    const totalProducts = products.length;
    const totalSales = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    
    document.getElementById('totalUsers').textContent = totalUsers;
    document.getElementById('totalProducts').textContent = totalProducts;
    document.getElementById('totalSales').textContent = totalSales;
    document.getElementById('totalRevenue').textContent = `₡${totalRevenue.toLocaleString()}`;
    
    // Create sales chart
    const ctx = document.getElementById('salesChart')?.getContext('2d');
    if (ctx) {
        const last7Days = getLast7Days();
        const salesByDay = getSalesByDay(orders, last7Days);
        
        if (salesChart) salesChart.destroy();
        
        salesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: last7Days,
                datasets: [{
                    label: 'Ventas (₡)',
                    data: salesByDay,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Ventas de los últimos 7 días' }
                }
            }
        });
    }
}

function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date.toLocaleDateString('es-CR'));
    }
    return days;
}

function getSalesByDay(orders, days) {
    return days.map(day => {
        return orders.filter(order => {
            const orderDate = new Date(order.fecha).toLocaleDateString('es-CR');
            return orderDate === day;
        }).reduce((sum, order) => sum + order.total, 0);
    });
}

// Load Products Table
function loadProductsTable() {
    const products = JSON.parse(localStorage.getItem('petcare_products') || '[]');
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = products.map(product => `
        <tr>
            <td>${product.id}</td>
            <td><img src="${product.imagen}" width="50" height="50" style="object-fit: cover; border-radius: 8px;"></td>
            <td>${product.nombre}</td>
            <td>${product.categoria}</td>
            <td>₡${product.precio.toLocaleString()}</td>
            <td>${product.stock}</td>
            <td>
                <button class="btn-edit" onclick="editProduct('${product.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn-delete" onclick="deleteProduct('${product.id}')"><i class="fas fa-trash"></i></button>
                <button class="btn-restock" onclick="restockProduct('${product.id}')"><i class="fas fa-plus-circle"></i></button>
            </td>
        </tr>
    `).join('');
}

// Load Categories Table
function loadCategoriesTable() {
    const categories = JSON.parse(localStorage.getItem('petcare_categories') || '[]');
    const tbody = document.getElementById('categoriesTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = categories.map((category, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${category}</td>
            <td>
                <button class="btn-edit" onclick="editCategory('${category}')"><i class="fas fa-edit"></i></button>
                <button class="btn-delete" onclick="deleteCategory('${category}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

// Load Users Table
function loadUsersTable() {
    const users = JSON.parse(localStorage.getItem('petcare_users') || '[]');
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.nombre} ${user.apellido}</td>
            <td>${user.email}</td>
            <td>${user.telefono}</td>
            <td>${user.direccion}</td>
            <td><span class="user-role ${user.rol}">${user.rol}</span></td>
            <td>${new Date(user.fechaRegistro).toLocaleDateString()}</td>
        </tr>
    `).join('');
}

// Load Orders Table
function loadOrdersTable() {
    const orders = JSON.parse(localStorage.getItem('petcare_orders') || '[]');
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = orders.sort((a,b) => new Date(b.fecha) - new Date(a.fecha)).map(order => `
        <tr>
            <td>${order.id.slice(-8)}</td>
            <td>${order.userName}</td>
            <td>${new Date(order.fecha).toLocaleDateString()}</td>
            <td>₡${order.total.toLocaleString()}</td>
            <td><span style="color:#4CAF50">${order.estado}</span></td>
            <td>${order.paymentMethod}</td>
            <td><button class="btn-edit" onclick="viewOrderDetails('${order.id}')"><i class="fas fa-eye"></i></button></td>
        </tr>
    `).join('');
}

// Load Consultas
function loadConsultas() {
    const consultas = JSON.parse(localStorage.getItem('petcare_consultas') || '[]');
    const container = document.getElementById('consultasList');
    if (!container) return;
    
    if (consultas.length === 0) {
        container.innerHTML = '<p>No hay consultas pendientes</p>';
        return;
    }
    
    container.innerHTML = consultas.sort((a,b) => new Date(b.fecha) - new Date(a.fecha)).map(consulta => `
        <div class="consulta-item" data-id="${consulta.id}">
            <div class="consulta-header">
                <span class="consulta-usuario">${consulta.usuarioNombre}</span>
                <span class="consulta-fecha">${new Date(consulta.fecha).toLocaleString()}</span>
            </div>
            <div class="consulta-mensaje"><strong>Mensaje:</strong> ${consulta.mensaje}</div>
            ${consulta.respondida ? 
                `<div class="consulta-respuesta"><strong>Respuesta:</strong> ${consulta.respuesta}</div>` : 
                `<button class="btn-secondary responder-btn" data-id="${consulta.id}">Responder</button>`
            }
        </div>
    `).join('');
    
    // Add responder event listeners
    document.querySelectorAll('.responder-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const consultaId = btn.getAttribute('data-id');
            const respuesta = document.getElementById('respuestaConsulta').value;
            if (respuesta) {
                if (responderConsulta(consultaId, respuesta)) {
                    showNotification('Respuesta enviada', 'success');
                    document.getElementById('respuestaConsulta').value = '';
                    loadConsultas();
                }
            } else {
                showNotification('Escribe una respuesta', 'error');
            }
        });
    });
}

// Product CRUD
function editProduct(productId) {
    const products = JSON.parse(localStorage.getItem('petcare_products') || '[]');
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    document.getElementById('modalTitle').textContent = 'Editar Producto';
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.nombre;
    document.getElementById('productDescription').value = product.descripcion;
    document.getElementById('productPrice').value = product.precio;
    document.getElementById('productStock').value = product.stock;
    document.getElementById('productCategory').value = product.categoria;
    document.getElementById('productImage').value = product.imagen;
    
    document.getElementById('productModal').style.display = 'block';
}

function deleteProduct(productId) {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
        let products = JSON.parse(localStorage.getItem('petcare_products') || '[]');
        products = products.filter(p => p.id !== productId);
        localStorage.setItem('petcare_products', JSON.stringify(products));
        loadProductsTable();
        loadDashboard();
        showNotification('Producto eliminado', 'success');
    }
}

function restockProduct(productId) {
    const newStock = prompt('Ingrese la nueva cantidad de stock:');
    if (newStock !== null && !isNaN(newStock) && parseInt(newStock) >= 0) {
        let products = JSON.parse(localStorage.getItem('petcare_products') || '[]');
        const product = products.find(p => p.id === productId);
        if (product) {
            product.stock = parseInt(newStock);
            localStorage.setItem('petcare_products', JSON.stringify(products));
            loadProductsTable();
            showNotification('Stock actualizado', 'success');
        }
    }
}

// Category CRUD
function addCategory() {
    const newCategory = document.getElementById('newCategoryName')?.value.trim();
    if (!newCategory) {
        showNotification('Ingrese un nombre de categoría', 'error');
        return;
    }
    
    let categories = JSON.parse(localStorage.getItem('petcare_categories') || '[]');
    if (categories.includes(newCategory)) {
        showNotification('La categoría ya existe', 'error');
        return;
    }
    
    categories.push(newCategory);
    localStorage.setItem('petcare_categories', JSON.stringify(categories));
    loadCategoriesTable();
    document.getElementById('newCategoryName').value = '';
    showNotification('Categoría agregada', 'success');
}

function editCategory(oldName) {
    const newName = prompt('Ingrese el nuevo nombre de la categoría:', oldName);
    if (newName && newName !== oldName) {
        let categories = JSON.parse(localStorage.getItem('petcare_categories') || '[]');
        const index = categories.indexOf(oldName);
        if (index !== -1) {
            categories[index] = newName;
            localStorage.setItem('petcare_categories', JSON.stringify(categories));
            
            // Update products
            let products = JSON.parse(localStorage.getItem('petcare_products') || '[]');
            products = products.map(product => {
                if (product.categoria === oldName) product.categoria = newName;
                return product;
            });
            localStorage.setItem('petcare_products', JSON.stringify(products));
            
            loadCategoriesTable();
            loadProductsTable();
            showNotification('Categoría actualizada', 'success');
        }
    }
}

function deleteCategory(categoryName) {
    if (confirm(`¿Eliminar categoría "${categoryName}"?`)) {
        let categories = JSON.parse(localStorage.getItem('petcare_categories') || '[]');
        categories = categories.filter(c => c !== categoryName);
        localStorage.setItem('petcare_categories', JSON.stringify(categories));
        loadCategoriesTable();
        showNotification('Categoría eliminada', 'success');
    }
}

// Save product
function saveProduct(event) {
    event.preventDefault();
    
    const productId = document.getElementById('productId').value;
    const productData = {
        id: productId || Date.now().toString(),
        nombre: document.getElementById('productName').value,
        descripcion: document.getElementById('productDescription').value,
        precio: parseInt(document.getElementById('productPrice').value),
        stock: parseInt(document.getElementById('productStock').value),
        categoria: document.getElementById('productCategory').value,
        imagen: document.getElementById('productImage').value,
        fechaCreacion: new Date().toISOString()
    };
    
    if (!productData.nombre || !productData.descripcion || !productData.precio || !productData.categoria) {
        showNotification('Complete todos los campos', 'error');
        return;
    }
    
    let products = JSON.parse(localStorage.getItem('petcare_products') || '[]');
    
    if (productId) {
        const index = products.findIndex(p => p.id === productId);
        if (index !== -1) products[index] = { ...products[index], ...productData };
    } else {
        products.push(productData);
    }
    
    localStorage.setItem('petcare_products', JSON.stringify(products));
    document.getElementById('productModal').style.display = 'none';
    loadProductsTable();
    loadDashboard();
    showNotification('Producto guardado', 'success');
}

// View order details
function viewOrderDetails(orderId) {
    const orders = JSON.parse(localStorage.getItem('petcare_orders') || '[]');
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    let details = `📦 PEDIDO #${order.id.slice(-8)}\n`;
    details += `👤 Cliente: ${order.userName}\n`;
    details += `📧 Email: ${order.userEmail}\n`;
    details += `📅 Fecha: ${new Date(order.fecha).toLocaleString()}\n`;
    details += `📍 Dirección: ${order.deliveryAddress}\n`;
    details += `💳 Pago: ${order.paymentMethod}\n`;
    details += `\n📋 PRODUCTOS:\n`;
    order.items.forEach(item => {
        details += `   • ${item.nombre} x ${item.cantidad} = ₡${(item.precio * item.cantidad).toLocaleString()}\n`;
    });
    details += `\n💰 TOTAL: ₡${order.total.toLocaleString()}`;
    
    alert(details);
}

// Navigation
function setupAdminNavigation() {
    const navLinks = document.querySelectorAll('.admin-nav a');
    const sections = document.querySelectorAll('.admin-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            if (!sectionId) return;
            
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(`${sectionId}Section`).classList.add('active');
            
            // Load data
            switch(sectionId) {
                case 'dashboard': loadDashboard(); break;
                case 'products': loadProductsTable(); break;
                case 'categories': loadCategoriesTable(); break;
                case 'users': loadUsersTable(); break;
                case 'orders': loadOrdersTable(); break;
                case 'consultas': loadConsultas(); break;
            }
        });
    });
}

// Initialize admin
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAdminAccess()) return;
    
    // Load category select
    function loadCategorySelect() {
        const categories = JSON.parse(localStorage.getItem('petcare_categories') || '[]');
        const select = document.getElementById('productCategory');
        if (select) {
            select.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
        }
    }
    
    setupAdminNavigation();
    loadDashboard();
    loadProductsTable();
    loadCategorySelect();
    
    // Add product button
    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => {
            document.getElementById('modalTitle').textContent = 'Agregar Producto';
            document.getElementById('productForm').reset();
            document.getElementById('productId').value = '';
            document.getElementById('productModal').style.display = 'block';
        });
    }
    
    // Add category button
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    if (addCategoryBtn) addCategoryBtn.addEventListener('click', addCategory);
    
    // Product form
    const productForm = document.getElementById('productForm');
    if (productForm) productForm.addEventListener('submit', saveProduct);
    
    // Close modal
    const closeModal = document.querySelector('#productModal .close-modal');
    const modal = document.getElementById('productModal');
    if (closeModal && modal) {
        closeModal.addEventListener('click', () => modal.style.display = 'none');
        window.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    }
});