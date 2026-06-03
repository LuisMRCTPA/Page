let allProducts = [];

function loadProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    // Recargar productos desde localStorage
    allProducts = JSON.parse(localStorage.getItem('petcare_products') || '[]');
    console.log('Productos cargados:', allProducts.length);
    
    if (allProducts.length === 0) {
        grid.innerHTML = '<div class="no-products"><i class="fas fa-box-open"></i><p>No hay productos disponibles. El administrador debe agregar productos.</p></div>';
        return;
    }
    
    filterAndDisplayProducts();
}

function filterAndDisplayProducts() {
    const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const category = document.getElementById('categoryFilter')?.value || '';
    const stockFilter = document.getElementById('stockFilter')?.value || '';
    const maxPrice = parseInt(document.getElementById('priceSlider')?.value) || 100000;
    
    let filtered = allProducts.filter(p => {
        const matchesSearch = !search || p.nombre.toLowerCase().includes(search) || p.descripcion.toLowerCase().includes(search);
        const matchesCategory = !category || p.categoria === category;
        const matchesPrice = p.precio <= maxPrice;
        const matchesStock = !stockFilter || (stockFilter === 'in' && p.stock > 0) || (stockFilter === 'out' && p.stock === 0);
        return matchesSearch && matchesCategory && matchesPrice && matchesStock;
    });
    
    displayProducts(filtered);
    const countEl = document.getElementById('productsCount');
    if (countEl) countEl.textContent = `Mostrando ${filtered.length} de ${allProducts.length} productos`;
}

function displayProducts(products) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    if (products.length === 0) {
        grid.innerHTML = '<div class="no-products"><i class="fas fa-box-open"></i><p>No se encontraron productos con estos filtros</p></div>';
        return;
    }
    
    grid.innerHTML = products.map(p => `
        <div class="product-card">
            <img src="${p.imagen}" alt="${p.nombre}" onerror="this.src='https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=300&h=200&fit=crop'">
            <div class="product-info">
                <h3>${p.nombre}</h3>
                <p class="description">${p.descripcion.substring(0, 60)}...</p>
                <p class="price">₡${p.precio.toLocaleString()}</p>
                <span class="category">${p.categoria}</span>
                <p class="stock ${p.stock > 0 ? 'in-stock' : 'out-stock'}">${p.stock > 0 ? `📦 Stock: ${p.stock}` : '❌ Agotado'}</p>
                ${p.stock > 0 ? `<button onclick="addToCart('${p.id}', 1)" class="btn-add-cart-simple"><i class="fas fa-cart-plus"></i> Agregar al Carrito</button>` : '<button disabled class="btn-disabled">Agotado</button>'}
            </div>
        </div>
    `).join('');
}

function loadCategoryFilter() {
    const select = document.getElementById('categoryFilter');
    if (!select) return;
    const cats = JSON.parse(localStorage.getItem('petcare_categories') || '[]');
    select.innerHTML = '<option value="">Todas las categorías</option>' + cats.map(c => `<option value="${c}">${c}</option>`).join('');
}

function setupFilters() {
    const search = document.getElementById('searchInput');
    const category = document.getElementById('categoryFilter');
    const priceSlider = document.getElementById('priceSlider');
    const priceValue = document.getElementById('priceValue');
    const stock = document.getElementById('stockFilter');
    const clear = document.getElementById('clearFilters');
    
    if (search) search.addEventListener('input', filterAndDisplayProducts);
    if (category) category.addEventListener('change', filterAndDisplayProducts);
    if (stock) stock.addEventListener('change', filterAndDisplayProducts);
    if (priceSlider && priceValue) {
        priceSlider.addEventListener('input', (e) => { 
            priceValue.textContent = parseInt(e.target.value).toLocaleString(); 
            filterAndDisplayProducts(); 
        });
    }
    if (clear) {
        clear.addEventListener('click', () => {
            if (search) search.value = '';
            if (category) category.value = '';
            if (priceSlider) priceSlider.value = '100000';
            if (priceValue) priceValue.textContent = '100,000';
            if (stock) stock.value = '';
            filterAndDisplayProducts();
        });
    }
}

function updateUserMenu() {
    const user = getCurrentUser();
    const menu = document.getElementById('userMenu');
    if (!menu) return;
    if (user) {
        menu.innerHTML = `<a href="perfil.html"><i class="fas fa-user"></i> ${user.nombre}</a>
            <a href="#" id="cartIconNav"><i class="fas fa-shopping-cart"></i> Carrito <span id="cartCountNav" class="cart-count">0</span></a>
            ${user.rol === 'admin' ? '<a href="admin.html"><i class="fas fa-cog"></i> Admin</a>' : ''}
            <a href="#" id="logoutBtnStore"><i class="fas fa-sign-out-alt"></i> Salir</a>`;
        document.getElementById('logoutBtnStore')?.addEventListener('click', (e) => { e.preventDefault(); logoutUser(); });
        document.getElementById('cartIconNav')?.addEventListener('click', (e) => { e.preventDefault(); document.getElementById('viewCartBtn')?.click(); });
    } else {
        menu.innerHTML = '<a href="login.html">Iniciar Sesión</a><a href="registro.html">Registrarse</a>';
    }
    updateCartCountDisplay();
}

document.addEventListener('DOMContentLoaded', () => {
    updateUserMenu();
    loadProducts();
    loadCategoryFilter();
    setupFilters();
    updateCartCountDisplay();
});