// At the top of js/auth.js
const API_URL = 'http://localhost:5000/api';

// Storage Keys (maintaining original names)
const STORAGE_KEYS = {
    USERS: 'petcare_users',  // Kept for compatibility but won't be used for auth
    CURRENT_USER: 'petcare_current_user',
    PRODUCTS: 'petcare_products',  // Kept for compatibility
    CATEGORIES: 'petcare_categories',
    ORDERS: 'petcare_orders',
    CART: 'petcare_cart',
    CONSULTAS: 'petcare_consultas',
    TOKEN: 'petcare_token'  // New for JWT
};

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN) || sessionStorage.getItem(STORAGE_KEYS.TOKEN);
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };
    
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...defaultOptions,
        ...options,
        headers: { ...defaultOptions.headers, ...options.headers }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || 'Error en la petición');
    }
    
    return data;
}

// Modified: Keep original function signature but connect to MongoDB
async function generateSampleProducts() {
    // This is now handled by backend, but kept for compatibility
    return [];
}

// Modified: Initialize data from MongoDB
async function initializeData() {
    try {
        // Check if products exist in backend
        const products = await apiCall('/products').catch(() => []);
        if (products.length === 0) {
            await apiCall('/seed/products', { method: 'POST' });
            console.log('Productos inicializados en MongoDB');
        }
        
        // Get categories from backend products
        const allProducts = await apiCall('/products').catch(() => []);
        const categories = [...new Set(allProducts.map(p => p.categoria))];
        if (categories.length > 0) {
            localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
        }
        
        // For backward compatibility, also fetch products to localStorage
        if (allProducts.length > 0) {
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(allProducts));
        }
        
        console.log('Datos sincronizados con MongoDB');
    } catch (error) {
        console.error('Error initializing data:', error);
        // Fallback to local data if backend is not available
        if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
            const fallbackProducts = generateFallbackProducts();
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(fallbackProducts));
        }
        if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
            localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(['Alimentos', 'Medicamentos', 'Accesorios', 'Juguetes', 'Higiene', 'Vitaminas']));
        }
    }
}

// Fallback products if backend is down
function generateFallbackProducts() {
    const categories = ['Alimentos', 'Medicamentos', 'Accesorios', 'Juguetes', 'Higiene', 'Vitaminas'];
    const products = [];
    const images = [
        'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1548621275-9d0d6654dfb9?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=300&h=200&fit=crop'
    ];
    
    const nombres = [
        'Royal Canin Adulto', 'Pedigree Carne', 'Whiskas Pescado', 'Dogui Premium', 'Cat Chow',
        'Desparasitante Interno', 'Vacuna Antirrábica', 'Antipulgas Spray', 'Vitaminas Premium', 'Shampoo Medicado',
        'Cama Ortopédica', 'Collar Antipulgas', 'Bebedero Automático', 'Comedero Elevado', 'Cepillo Deslanador',
        'Pelota Squeaker', 'Cuerda Juguete', 'Ratón Eléctrico', 'Túnel para Gatos', 'Hueso de Nylon',
        'Shampoo Seco', 'Cepillo Dental', 'Cortaúñas Profesional', 'Limpia Oídos', 'Pañales Desechables',
        'Complejo B', 'Calcio Líquido', 'Omega 3', 'Probióticos', 'Glucosamina'
    ];
    
    for (let i = 0; i < 30; i++) {
        const category = categories[i % categories.length];
        const price = (Math.floor(Math.random() * 50) + 10) * 1000;
        const stock = Math.floor(Math.random() * 50) + 5;
        
        products.push({
            id: (i + 1).toString(),
            nombre: nombres[i % nombres.length] + (Math.floor(i / categories.length) + 1),
            descripcion: `Producto de alta calidad para el cuidado de tu mascota. ${category} premium con los mejores ingredientes.`,
            precio: price,
            stock: stock,
            categoria: category,
            imagen: images[i % images.length],
            fechaCreacion: new Date().toISOString()
        });
    }
    return products;
}

// Modified: registerUser - same signature, connects to MongoDB
async function registerUser(userData) {
    try {
        const response = await apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        // Store token and user data
        if (userData.rememberMe) {
            localStorage.setItem(STORAGE_KEYS.TOKEN, response.token);
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(response.user));
        } else {
            sessionStorage.setItem(STORAGE_KEYS.TOKEN, response.token);
            sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(response.user));
        }
        
        // For backward compatibility, also update local users array
        updateLocalUsersArray(response.user, userData.password);
        
        return response.user;
    } catch (error) {
        throw error;
    }
}

// Helper to maintain local users array for backward compatibility
function updateLocalUsersArray(user, password) {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const existingIndex = users.findIndex(u => u.email === user.email);
    
    const localUser = {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        telefono: user.telefono,
        direccion: user.direccion,
        password: password,
        rol: user.rol,
        fechaRegistro: new Date().toISOString()
    };
    
    if (existingIndex === -1) {
        users.push(localUser);
    } else {
        users[existingIndex] = localUser;
    }
    
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

// Modified: loginUser - same signature, connects to MongoDB
async function loginUser(email, password, rememberMe = false) {
    try {
        const response = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        // Store token and user data
        if (rememberMe) {
            localStorage.setItem(STORAGE_KEYS.TOKEN, response.token);
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(response.user));
        } else {
            sessionStorage.setItem(STORAGE_KEYS.TOKEN, response.token);
            sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(response.user));
        }
        
        return response.user;
    } catch (error) {
        throw error;
    }
}

// Modified: getCurrentUser - same functionality, works with token
function getCurrentUser() {
    // Try to get from storage first
    const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 
                 sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    
    if (user) {
        return JSON.parse(user);
    }
    
    // If not in storage but token exists, try to fetch from backend
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN) || sessionStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
        // Async fetch - will be called by components that need it
        fetchCurrentUserFromBackend();
    }
    
    return null;
}

// Helper to fetch current user from backend
async function fetchCurrentUserFromBackend() {
    try {
        const user = await apiCall('/auth/me');
        const currentUser = getCurrentUser();
        if (currentUser && localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        } else if (currentUser && sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
            sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        }
        return user;
    } catch (error) {
        console.error('Error fetching current user:', error);
        return null;
    }
}

// Modified: logoutUser - same functionality, clears token
function logoutUser() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    window.location.href = 'index.html';
}

// Modified: updateUserProfile - same signature, connects to MongoDB
async function updateUserProfile(userData) {
    try {
        const response = await apiCall('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
        
        // Update stored user data
        const currentUser = getCurrentUser();
        const updatedUser = { ...currentUser, ...response };
        
        if (localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));
        } else {
            sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));
        }
        
        // Update local users array
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        const userIndex = users.findIndex(u => u.id === updatedUser.id);
        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...userData };
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        }
        
        return updatedUser;
    } catch (error) {
        throw error;
    }
}

// Modified: addConsulta - same signature, connects to MongoDB
async function addConsulta(mensaje, userId, userName, userEmail) {
    try {
        const response = await apiCall('/consultas', {
            method: 'POST',
            body: JSON.stringify({ mensaje, usuarioNombre: userName, usuarioEmail: userEmail })
        });
        
        // Update local consultas for backward compatibility
        const consultas = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONSULTAS) || '[]');
        consultas.push({
            id: response.id || Date.now().toString(),
            usuarioId: userId,
            usuarioNombre: userName,
            usuarioEmail: userEmail,
            mensaje: mensaje,
            fecha: new Date().toISOString(),
            respondida: false,
            respuesta: null
        });
        localStorage.setItem(STORAGE_KEYS.CONSULTAS, JSON.stringify(consultas));
        
        return response;
    } catch (error) {
        console.error('Error adding consulta:', error);
        // Fallback to local storage
        const consultas = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONSULTAS) || '[]');
        consultas.push({
            id: Date.now().toString(),
            usuarioId: userId,
            usuarioNombre: userName,
            usuarioEmail: userEmail,
            mensaje: mensaje,
            fecha: new Date().toISOString(),
            respondida: false,
            respuesta: null
        });
        localStorage.setItem(STORAGE_KEYS.CONSULTAS, JSON.stringify(consultas));
    }
}

// Modified: responderConsulta - same signature, connects to MongoDB
async function responderConsulta(consultaId, respuesta) {
    try {
        const response = await apiCall(`/consultas/${consultaId}/responder`, {
            method: 'PUT',
            body: JSON.stringify({ respuesta })
        });
        
        // Update local consultas for backward compatibility
        const consultas = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONSULTAS) || '[]');
        const consulta = consultas.find(c => c.id === consultaId);
        if (consulta) {
            consulta.respondida = true;
            consulta.respuesta = respuesta;
            consulta.fechaRespuesta = new Date().toISOString();
            localStorage.setItem(STORAGE_KEYS.CONSULTAS, JSON.stringify(consultas));
        }
        
        return true;
    } catch (error) {
        console.error('Error responding to consulta:', error);
        return false;
    }
}

// New helper functions for products (maintaining compatibility)
async function getProductsFromBackend() {
    try {
        const products = await apiCall('/products');
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
        return products;
    } catch (error) {
        console.error('Error fetching products:', error);
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
    }
}

async function createProduct(productData) {
    try {
        const product = await apiCall('/products', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
        await getProductsFromBackend(); // Refresh local cache
        return product;
    } catch (error) {
        throw error;
    }
}

async function updateProduct(id, productData) {
    try {
        const product = await apiCall(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(productData)
        });
        await getProductsFromBackend(); // Refresh local cache
        return product;
    } catch (error) {
        throw error;
    }
}

async function deleteProduct(id) {
    try {
        await apiCall(`/products/${id}`, {
            method: 'DELETE'
        });
        await getProductsFromBackend(); // Refresh local cache
        return true;
    } catch (error) {
        throw error;
    }
}

// Modified: showNotification - kept exactly the same
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i><span>${message}</span>`;
    notification.style.cssText = `position:fixed;bottom:20px;right:20px;padding:12px 20px;background:${type === 'success' ? '#4CAF50' : '#f44336'};color:white;border-radius:10px;z-index:10000;display:flex;align-items:center;gap:10px;box-shadow:0 4px 12px rgba(0,0,0,0.15);animation:slideInRight 0.3s ease;`;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Modified: DOMContentLoaded - maintained structure but with async/await
document.addEventListener('DOMContentLoaded', async () => {
    await initializeData();
    
    // Login Form Handler (maintained same logic)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
            submitBtn.disabled = true;
            
            try {
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const rememberMe = document.getElementById('rememberMe')?.checked;
                
                const user = await loginUser(email, password, rememberMe);
                showNotification(`¡Bienvenido ${user.nombre}!`, 'success');
                
                setTimeout(() => {
                    window.location.href = user.rol === 'admin' ? 'admin.html' : 'index.html';
                }, 1000);
            } catch (error) {
                showNotification(error.message, 'error');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // Register Form Handler (maintained same logic)
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (password !== confirmPassword) {
                showNotification('Las contraseñas no coinciden', 'error');
                return;
            }
            
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
            submitBtn.disabled = true;
            
            try {
                const userData = {
                    nombre: document.getElementById('nombre').value,
                    apellido: document.getElementById('apellido').value,
                    email: document.getElementById('email').value,
                    telefono: document.getElementById('telefono').value,
                    direccion: document.getElementById('direccion').value,
                    password: password,
                    rememberMe: false
                };
                
                await registerUser(userData);
                showNotification('Registro exitoso! Redirigiendo...', 'success');
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } catch (error) {
                showNotification(error.message, 'error');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // Logout buttons (same selectors)
    document.querySelectorAll('#logoutBtnPerfil, #logoutAdmin').forEach(btn => {
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                logoutUser();
            });
        }
    });
});

// CSS animations (same as before)
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
    
    .fa-spin {
        animation: fa-spin 2s infinite linear;
    }
    
    @keyframes fa-spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
`;
document.head.appendChild(style);