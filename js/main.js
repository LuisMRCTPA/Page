let currentSlide = 0;
let autoSlideInterval;

function initCarousel() {
    const products = JSON.parse(localStorage.getItem('petcare_products') || '[]');
    const carouselProducts = products.slice(0, 5);
    const slidesContainer = document.getElementById('carouselSlides');
    const dotsContainer = document.getElementById('carouselDots');
    if (!slidesContainer || carouselProducts.length === 0) return;
    
    slidesContainer.innerHTML = carouselProducts.map(p => `
        <div class="carousel-slide">
            <img src="${p.imagen}" alt="${p.nombre}" onerror="this.src='https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=1200&h=400&fit=crop'">
            <div class="carousel-caption">
                <h3>${p.nombre}</h3>
                <p>₡${p.precio.toLocaleString()}</p>
                <button onclick="location.href='tienda.html'" class="btn-primary">Ver Producto</button>
            </div>
        </div>
    `).join('');
    
    if (dotsContainer) {
        dotsContainer.innerHTML = '';
        for (let i = 0; i < carouselProducts.length; i++) {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToSlide(i));
            dotsContainer.appendChild(dot);
        }
    }
    
    function goToSlide(index) { 
        currentSlide = index; 
        slidesContainer.style.transform = `translateX(-${currentSlide * 100}%)`; 
        updateDots(); 
        resetAutoSlide(); 
    }
    function nextSlide() { 
        currentSlide = (currentSlide + 1) % carouselProducts.length; 
        goToSlide(currentSlide); 
    }
    function prevSlide() { 
        currentSlide = (currentSlide - 1 + carouselProducts.length) % carouselProducts.length; 
        goToSlide(currentSlide); 
    }
    function updateDots() { 
        document.querySelectorAll('.dot').forEach((dot, i) => dot.classList.toggle('active', i === currentSlide)); 
    }
    function startAutoSlide() { 
        autoSlideInterval = setInterval(nextSlide, 5000); 
    }
    function resetAutoSlide() { 
        clearInterval(autoSlideInterval); 
        startAutoSlide(); 
    }
    
    document.getElementById('prevBtn')?.addEventListener('click', prevSlide);
    document.getElementById('nextBtn')?.addEventListener('click', nextSlide);
    startAutoSlide();
}

function loadCategories() {
    const grid = document.getElementById('categoriesGrid');
    if (!grid) return;
    const cats = JSON.parse(localStorage.getItem('petcare_categories') || '[]');
    const icons = ['fa-dog', 'fa-capsules', 'fa-bone', 'fa-baseball-ball', 'fa-shower', 'fa-apple-alt'];
    grid.innerHTML = cats.map((cat, i) => `<div class="category-card" onclick="location.href='tienda.html'"><i class="fas ${icons[i % icons.length]}"></i><h3>${cat}</h3><p>Ver productos</p></div>`).join('');
}

function loadFeaturedProducts() {
    const grid = document.getElementById('featuredProductsGrid');
    if (!grid) return;
    const products = JSON.parse(localStorage.getItem('petcare_products') || '[]');
    const featured = products.slice(0, 8);
    
    if (featured.length === 0) {
        grid.innerHTML = '<p>Cargando productos...</p>';
        return;
    }
    
    grid.innerHTML = featured.map(p => `
        <div class="product-card">
            <img src="${p.imagen}" alt="${p.nombre}" onerror="this.src='https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=300&h=200&fit=crop'">
            <div class="product-info">
                <h3>${p.nombre}</h3>
                <p class="price">₡${p.precio.toLocaleString()}</p>
                <button onclick="addToCart('${p.id}', 1)">Agregar al Carrito</button>
            </div>
        </div>
    `).join('');
}

function addToCart(productId, quantity) {
    const user = getCurrentUser();
    if (!user) { 
        showNotification('Inicia sesión primero', 'error'); 
        setTimeout(() => location.href = 'login.html', 1500); 
        return; 
    }
    const products = JSON.parse(localStorage.getItem('petcare_products') || '[]');
    const product = products.find(p => p.id === productId);
    if (!product || product.stock === 0) { 
        showNotification('Producto agotado', 'error'); 
        return; 
    }
    let cart = JSON.parse(localStorage.getItem('petcare_cart') || '[]');
    const existing = cart.find(i => i.productId === productId);
    if (existing) { 
        if (product.stock > existing.cantidad) existing.cantidad++; 
        else { showNotification('Stock insuficiente', 'error'); return; }
    } else cart.push({ productId, cantidad: 1, precio: product.precio, nombre: product.nombre, imagen: product.imagen });
    localStorage.setItem('petcare_cart', JSON.stringify(cart));
    updateCartCountDisplay();
    showNotification(`${product.nombre} agregado`, 'success');
}

function updateCartCountDisplay() {
    const cart = JSON.parse(localStorage.getItem('petcare_cart') || '[]');
    const total = cart.reduce((s, i) => s + i.cantidad, 0);
    document.querySelectorAll('#cartCountHeader, #cartCountNav, #cartTotalItems, .cart-count').forEach(el => { if (el) el.textContent = total; });
}

function updateAuthUI() {
    const user = getCurrentUser();
    const authDiv = document.getElementById('authButtons');
    const userDiv = document.getElementById('userMenu');
    if (authDiv && userDiv) {
        if (user) {
            authDiv.style.display = 'none';
            userDiv.style.display = 'flex';
            userDiv.innerHTML = `<a href="tienda.html"><i class="fas fa-store"></i> Tienda</a>
                <a href="perfil.html"><i class="fas fa-user"></i> ${user.nombre}</a>
                <a href="#" id="cartIconHeader"><i class="fas fa-shopping-cart"></i> Carrito <span id="cartCountHeader" class="cart-count">0</span></a>
                ${user.rol === 'admin' ? '<a href="admin.html"><i class="fas fa-cog"></i> Admin</a>' : ''}
                <a href="#" id="logoutBtnHeader"><i class="fas fa-sign-out-alt"></i> Salir</a>`;
            document.getElementById('logoutBtnHeader')?.addEventListener('click', (e) => { e.preventDefault(); logoutUser(); });
        } else {
            authDiv.style.display = 'flex';
            userDiv.style.display = 'none';
        }
    }
    updateCartCountDisplay();
}

function initMobileMenu() {
    const icon = document.getElementById('menuIcon');
    const links = document.getElementById('navLinks');
    if (icon && links) icon.addEventListener('click', () => links.classList.toggle('active'));
}

function initConsultaFlotante() {
    const btn = document.getElementById('consultaFlotanteBtn');
    const modal = document.getElementById('consultaModal');
    const closeBtn = document.querySelector('.close-consulta');
    const enviarBtn = document.getElementById('enviarConsultaBtn');
    if (!btn || !modal) return;
    
    btn.addEventListener('click', () => {
        const user = getCurrentUser();
        if (!user) { showNotification('Inicia sesión para hacer consultas', 'error'); setTimeout(() => location.href = 'login.html', 1500); return; }
        modal.style.display = 'block';
    });
    if (closeBtn) closeBtn.addEventListener('click', () => modal.style.display = 'none');
    if (enviarBtn) {
        enviarBtn.addEventListener('click', () => {
            const user = getCurrentUser();
            if (!user) { showNotification('Inicia sesión', 'error'); return; }
            const mensaje = document.getElementById('consultaMensaje').value.trim();
            if (!mensaje) { showNotification('Escribe tu consulta', 'error'); return; }
            addConsulta(mensaje, user.id, `${user.nombre} ${user.apellido}`, user.email);
            showNotification('Consulta enviada. Te responderemos pronto', 'success');
            document.getElementById('consultaMensaje').value = '';
            modal.style.display = 'none';
        });
    }
    window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
}

document.addEventListener('DOMContentLoaded', () => {
    initCarousel();
    loadCategories();
    loadFeaturedProducts();
    initMobileMenu();
    updateAuthUI();
    initConsultaFlotante();
    document.getElementById('cartIconHeader')?.addEventListener('click', (e) => { e.preventDefault(); location.href = 'tienda.html'; });
    document.getElementById('newsletterForm')?.addEventListener('submit', (e) => { e.preventDefault(); showNotification('¡Gracias por suscribirte!', 'success'); e.target.reset(); });
});

window.addToCart = addToCart;
window.updateCartCountDisplay = updateCartCountDisplay;