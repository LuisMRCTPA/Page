// Profile Functionality

// Load user profile
function loadUserProfile() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    // Fill profile form
    const nombreInput = document.getElementById('profileNombre');
    const apellidoInput = document.getElementById('profileApellido');
    const emailInput = document.getElementById('profileEmail');
    const telefonoInput = document.getElementById('profileTelefono');
    const direccionInput = document.getElementById('profileDireccion');
    
    if (nombreInput) nombreInput.value = user.nombre || '';
    if (apellidoInput) apellidoInput.value = user.apellido || '';
    if (emailInput) emailInput.value = user.email || '';
    if (telefonoInput) telefonoInput.value = user.telefono || '';
    if (direccionInput) direccionInput.value = user.direccion || '';
    
    // Load order history
    loadOrderHistory(user);
}

// Load order history
function loadOrderHistory(user) {
    const ordersContainer = document.getElementById('orderHistory');
    if (!ordersContainer) return;
    
    const allOrders = JSON.parse(localStorage.getItem('petcare_orders') || '[]');
    const userOrders = allOrders.filter(order => order.userId === user.id);
    
    if (userOrders.length === 0) {
        ordersContainer.innerHTML = '<div class="empty-orders"><i class="fas fa-receipt"></i><p>No has realizado ninguna compra aún</p><a href="tienda.html" class="btn-primary">Ir a la tienda</a></div>';
        document.getElementById('totalSpent').textContent = '0';
        return;
    }
    
    const totalSpent = userOrders.reduce((sum, order) => sum + order.total, 0);
    document.getElementById('totalSpent').textContent = totalSpent.toLocaleString();
    
    ordersContainer.innerHTML = userOrders.sort((a,b) => new Date(b.fecha) - new Date(a.fecha)).map(order => `
        <div class="order-item">
            <div class="order-header">
                <span class="order-id">Pedido #${order.id.slice(-8)}</span>
                <span class="order-date">${new Date(order.fecha).toLocaleDateString('es-CR')}</span>
                <span class="order-total">₡${order.total.toLocaleString()}</span>
            </div>
            <p>Método de pago: ${order.paymentMethod}</p>
            <p>Estado: <strong style="color:#4CAF50">${order.estado}</strong></p>
            <details class="order-products">
                <summary>Ver productos (${order.items.length})</summary>
                ${order.items.map(item => `
                    <div>• ${item.nombre} x ${item.cantidad} = ₡${(item.precio * item.cantidad).toLocaleString()}</div>
                `).join('')}
            </details>
        </div>
    `).join('');
}

// Update profile
function updateProfile(event) {
    event.preventDefault();
    
    const user = getCurrentUser();
    if (!user) return;
    
    const updatedData = {
        nombre: document.getElementById('profileNombre').value,
        apellido: document.getElementById('profileApellido').value,
        email: document.getElementById('profileEmail').value,
        telefono: document.getElementById('profileTelefono').value,
        direccion: document.getElementById('profileDireccion').value
    };
    
    try {
        updateUserProfile(updatedData);
        showNotification('Perfil actualizado correctamente', 'success');
        loadUserProfile();
    } catch (error) {
        showNotification('Error al actualizar el perfil: ' + error.message, 'error');
    }
}

// Tab functionality
function initProfileTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabs = document.querySelectorAll('.profile-tab');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            tabs.forEach(tab => tab.classList.remove('active'));
            document.getElementById(`${tabId}Tab`).classList.add('active');
        });
    });
}

// Initialize profile
document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
    initProfileTabs();
    
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', updateProfile);
    }
});