function addToCart(productId, quantity = 1) {
    const user = getCurrentUser();
    if (!user) { 
        showNotification('Inicia sesión para agregar al carrito', 'error'); 
        setTimeout(() => window.location.href = 'login.html', 1500); 
        return false; 
    }
    
    const products = JSON.parse(localStorage.getItem('petcare_products') || '[]');
    const product = products.find(p => p.id === productId);
    
    if (!product) { 
        showNotification('Producto no encontrado', 'error'); 
        return false; 
    }
    
    if (product.stock < quantity) { 
        showNotification(`Stock insuficiente. Solo hay ${product.stock} unidades`, 'error'); 
        return false; 
    }
    
    let cart = JSON.parse(localStorage.getItem('petcare_cart') || '[]');
    const existing = cart.find(i => i.productId === productId);
    
    if (existing) {
        if (product.stock >= existing.cantidad + quantity) {
            existing.cantidad += quantity;
            showNotification(`${product.nombre} - Ahora tienes ${existing.cantidad}`, 'success');
        } else { 
            showNotification('Stock máximo alcanzado', 'error'); 
            return false; 
        }
    } else {
        cart.push({ productId, cantidad: quantity, precio: product.precio, nombre: product.nombre, imagen: product.imagen });
        showNotification(`${product.nombre} agregado al carrito`, 'success');
    }
    
    localStorage.setItem('petcare_cart', JSON.stringify(cart));
    updateCartCountDisplay();
    return true;
}

function removeFromCart(productId) {
    let cart = JSON.parse(localStorage.getItem('petcare_cart') || '[]');
    const item = cart.find(i => i.productId === productId);
    cart = cart.filter(i => i.productId !== productId);
    localStorage.setItem('petcare_cart', JSON.stringify(cart));
    updateCartCountDisplay();
    renderCart();
    if (item) showNotification(`${item.nombre} eliminado`, 'success');
}

function getCartTotal() {
    const cart = JSON.parse(localStorage.getItem('petcare_cart') || '[]');
    return cart.reduce((t, i) => t + (i.precio * i.cantidad), 0);
}

function getCartItemCount() {
    const cart = JSON.parse(localStorage.getItem('petcare_cart') || '[]');
    return cart.reduce((c, i) => c + i.cantidad, 0);
}

function updateCartCountDisplay() {
    const count = getCartItemCount();
    const elements = document.querySelectorAll('#cartCountHeader, #cartCountNav, #cartTotalItems, .cart-count');
    elements.forEach(el => { if (el) el.textContent = count; });
}

function renderCart() {
    const container = document.getElementById('cartItems');
    if (!container) return;
    const cart = JSON.parse(localStorage.getItem('petcare_cart') || '[]');
    
    if (cart.length === 0) { 
        container.innerHTML = '<div class="empty-cart"><i class="fas fa-shopping-cart"></i><p>Carrito vacío</p><a href="tienda.html" class="btn-primary">Ir a la tienda</a></div>'; 
        document.getElementById('cartTotal').textContent = '0'; 
        return; 
    }
    
    container.innerHTML = cart.map(i => `
        <div class="cart-item">
            <div class="cart-item-info">
                <h4>${i.nombre}</h4>
                <p>Precio: ₡${i.precio.toLocaleString()}</p>
                <p>Cantidad: ${i.cantidad}</p>
                <p>Subtotal: ₡${(i.precio * i.cantidad).toLocaleString()}</p>
            </div>
            <div class="cart-item-actions">
                <button class="cart-item-remove" onclick="removeFromCart('${i.productId}')"><i class="fas fa-trash"></i> Eliminar</button>
            </div>
        </div>
    `).join('');
    document.getElementById('cartTotal').textContent = getCartTotal().toLocaleString();
}

function calculateDeliveryDate(paymentMethod) {
    const today = new Date();
    const days = paymentMethod === 'SINPE Móvil' ? 3 : 5;
    today.setDate(today.getDate() + days);
    return today.toLocaleDateString('es-CR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function processCheckout(data) {
    const user = getCurrentUser();
    if (!user) { showNotification('Inicia sesión', 'error'); return false; }
    const cart = JSON.parse(localStorage.getItem('petcare_cart') || '[]');
    if (cart.length === 0) { showNotification('Carrito vacío', 'error'); return false; }
    
    const products = JSON.parse(localStorage.getItem('petcare_products') || '[]');
    for (const item of cart) {
        const p = products.find(pr => pr.id === item.productId);
        if (!p || p.stock < item.cantidad) { showNotification(`Stock insuficiente de ${item.nombre}`, 'error'); return false; }
    }
    
    for (const item of cart) {
        const p = products.find(pr => pr.id === item.productId);
        p.stock -= item.cantidad;
    }
    localStorage.setItem('petcare_products', JSON.stringify(products));
    
    const order = {
        id: Date.now().toString(),
        userId: user.id,
        userName: `${user.nombre} ${user.apellido}`,
        userEmail: user.email,
        fecha: new Date().toISOString(),
        items: [...cart],
        total: getCartTotal(),
        shippingAddress: `${data.calle} ${data.numero}, ${data.ciudad}, ${data.provincia}`,
        paymentMethod: data.paymentMethod,
        deliveryDate: calculateDeliveryDate(data.paymentMethod),
        estado: 'Confirmado'
    };
    
    const orders = JSON.parse(localStorage.getItem('petcare_orders') || '[]');
    orders.push(order);
    localStorage.setItem('petcare_orders', JSON.stringify(orders));
    localStorage.setItem('petcare_cart', JSON.stringify([]));
    updateCartCountDisplay();
    return order;
}

function renderCheckoutSummary() {
    const cart = JSON.parse(localStorage.getItem('petcare_cart') || '[]');
    const container = document.getElementById('checkoutSummary');
    if (!container) return;
    container.innerHTML = cart.map(i => `<div class="checkout-item"><span>${i.nombre} x ${i.cantidad}</span><span>₡${(i.precio * i.cantidad).toLocaleString()}</span></div>`).join('');
    document.getElementById('checkoutTotal').textContent = getCartTotal().toLocaleString();
}

function showSuccessModal(order) {
    const modal = document.getElementById('successModal');
    if (!modal) return;
    document.getElementById('successOrderInfo').innerHTML = `
        <div class="order-info">
            <p><strong>Pedido:</strong> #${order.id.slice(-8)}</p>
            <p><strong>Total:</strong> ₡${order.total.toLocaleString()}</p>
            <p><strong>Pago:</strong> ${order.paymentMethod}</p>
            <div class="delivery-info">
                <h3>📦 Información de Entrega</h3>
                <p>Dirección: ${order.shippingAddress}</p>
                <p>Fecha estimada: ${order.deliveryDate}</p>
            </div>
        </div>
    `;
    modal.style.display = 'block';
}

function closeSuccessModal() { 
    document.getElementById('successModal').style.display = 'none'; 
    window.location.href = 'tienda.html'; 
}

document.addEventListener('DOMContentLoaded', () => {
    const viewCart = document.getElementById('viewCartBtn');
    const cartModal = document.getElementById('cartModal');
    const closeBtns = document.querySelectorAll('.close, .close-checkout');
    const continueBtn = document.getElementById('continueShopping');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const checkoutModal = document.getElementById('checkoutModal');
    const checkoutForm = document.getElementById('checkoutForm');
    
    if (viewCart) viewCart.addEventListener('click', () => { renderCart(); cartModal.style.display = 'block'; });
    closeBtns.forEach(btn => btn?.addEventListener('click', () => { 
        if (cartModal) cartModal.style.display = 'none'; 
        if (checkoutModal) checkoutModal.style.display = 'none'; 
    }));
    if (continueBtn && cartModal) continueBtn.addEventListener('click', () => cartModal.style.display = 'none');
    
    if (checkoutBtn && cartModal && checkoutModal) {
        checkoutBtn.addEventListener('click', () => {
            const cart = JSON.parse(localStorage.getItem('petcare_cart') || '[]');
            if (cart.length === 0) { showNotification('Carrito vacío', 'error'); return; }
            cartModal.style.display = 'none';
            renderCheckoutSummary();
            checkoutModal.style.display = 'block';
        });
    }
    
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
            if (!paymentMethod) { showNotification('Selecciona método de pago', 'error'); return; }
            const sinpeRef = document.getElementById('paymentReference')?.value;
            if (paymentMethod === 'SINPE Móvil' && !sinpeRef) { showNotification('Ingresa tu número SINPE', 'error'); return; }
            
            const order = processCheckout({
                calle: document.getElementById('calle').value,
                numero: document.getElementById('numero').value,
                ciudad: document.getElementById('ciudad').value,
                provincia: document.getElementById('provincia').value,
                paymentMethod: paymentMethod
            });
            if (order) { 
                checkoutModal.style.display = 'none'; 
                showSuccessModal(order); 
                setTimeout(() => window.location.reload(), 3000); 
            }
        });
    }
    
    document.querySelectorAll('input[name="paymentMethod"]').forEach(r => {
        r.addEventListener('change', () => document.getElementById('paymentReferenceGroup').style.display = r.value === 'SINPE Móvil' ? 'block' : 'none');
    });
    
    window.addEventListener('click', (e) => { 
        if (e.target === cartModal) cartModal.style.display = 'none'; 
        if (e.target === checkoutModal) checkoutModal.style.display = 'none'; 
    });
});

window.closeSuccessModal = closeSuccessModal;
window.removeFromCart = removeFromCart;
window.addToCart = addToCart;