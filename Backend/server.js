// server.js - Archivo único para backend con Express, MongoDB Atlas y autenticación JWT
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ============ MODELOS ============
const userSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    telefono: { type: String, required: true },
    direccion: { type: String, required: true },
    password: { type: String, required: true },
    rol: { type: String, default: 'cliente' },
    fechaRegistro: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
    nombre: String,
    descripcion: String,
    precio: Number,
    stock: Number,
    categoria: String,
    imagen: String,
    fechaCreacion: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    productos: Array,
    total: Number,
    estado: { type: String, default: 'pendiente' },
    fecha: { type: Date, default: Date.now }
});

const consultaSchema = new mongoose.Schema({
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    usuarioNombre: String,
    usuarioEmail: String,
    mensaje: String,
    fecha: { type: Date, default: Date.now },
    respondida: { type: Boolean, default: false },
    respuesta: String,
    fechaRespuesta: Date
});

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);
const Consulta = mongoose.model('Consulta', consultaSchema);

// ============ ENDPOINTS DE AUTENTICACIÓN ============
app.post('/api/auth/register', async (req, res) => {
    try {
        const { nombre, apellido, email, telefono, direccion, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: 'Email ya registrado' });
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ nombre, apellido, email, telefono, direccion, password: hashedPassword, rol: 'cliente' });
        await user.save();
        
        const token = jwt.sign(
            { id: user._id, email: user.email, rol: user.rol },
            process.env.JWT_SECRET || 'my_secret_key_123',
            { expiresIn: '7d' }
        );
        
        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            token,
            user: { id: user._id, nombre, apellido, email, telefono, direccion, rol: user.rol }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'Credenciales inválidas' });
        
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) return res.status(400).json({ error: 'Credenciales inválidas' });
        
        const token = jwt.sign(
            { id: user._id, email: user.email, rol: user.rol },
            process.env.JWT_SECRET || 'my_secret_key_123',
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            token,
            user: { id: user._id, nombre: user.nombre, apellido: user.apellido, email: user.email, telefono: user.telefono, direccion: user.direccion, rol: user.rol }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/auth/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'No autorizado' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'my_secret_key_123');
        const user = await User.findById(decoded.id).select('-password');
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(user);
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
});

app.put('/api/auth/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'my_secret_key_123');
        const user = await User.findByIdAndUpdate(
            decoded.id,
            { nombre: req.body.nombre, apellido: req.body.apellido, telefono: req.body.telefono, direccion: req.body.direccion },
            { new: true }
        ).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ PRODUCTOS ============
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/products', async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Producto eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ ÓRDENES ============
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await Order.find();
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'my_secret_key_123');
        const order = new Order({ ...req.body, usuarioId: decoded.id });
        await order.save();
        res.status(201).json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ CONSULTAS ============
app.get('/api/consultas', async (req, res) => {
    try {
        const consultas = await Consulta.find();
        res.json(consultas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/consultas', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'my_secret_key_123');
        const user = await User.findById(decoded.id);
        const consulta = new Consulta({
            usuarioId: decoded.id,
            usuarioNombre: `${user.nombre} ${user.apellido}`,
            usuarioEmail: user.email,
            mensaje: req.body.mensaje
        });
        await consulta.save();
        res.status(201).json(consulta);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/consultas/:id/responder', async (req, res) => {
    try {
        const consulta = await Consulta.findByIdAndUpdate(
            req.params.id,
            { respondida: true, respuesta: req.body.respuesta, fechaRespuesta: new Date() },
            { new: true }
        );
        res.json(consulta);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ SEED DE PRODUCTOS (opcional) ============
app.post('/api/seed/products', async (req, res) => {
    try {
        const count = await Product.countDocuments();
        if (count === 0) {
            const categories = ['Alimentos', 'Medicamentos', 'Accesorios', 'Juguetes', 'Higiene', 'Vitaminas'];
            const images = [
                'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=300&h=200&fit=crop',
                'https://images.unsplash.com/photo-1548621275-9d0d6654dfb9?w=300&h=200&fit=crop',
                'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=300&h=200&fit=crop',
                'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=300&h=200&fit=crop'
            ];
            const productNames = [
                'Royal Canin Adulto', 'Pedigree Carne', 'Whiskas Pescado', 'Dogui Premium',
                'Desparasitante Interno', 'Vacuna Antirrábica', 'Cama Ortopédica', 'Collar Antipulgas',
                'Shampoo Premium', 'Cepillo Dental', 'Pelota Juguete', 'Comedero Elevado'
            ];
            const products = [];
            for (let i = 0; i < 25; i++) {
                products.push({
                    nombre: productNames[i % productNames.length] + (Math.floor(i / productNames.length) + 1),
                    descripcion: 'Producto de alta calidad para tu mascota',
                    precio: (Math.floor(Math.random() * 50) + 10) * 1000,
                    stock: Math.floor(Math.random() * 50) + 5,
                    categoria: categories[i % categories.length],
                    imagen: images[i % images.length]
                });
            }
            await Product.insertMany(products);
            res.json({ message: `${products.length} productos creados` });
        } else {
            res.json({ message: `${count} productos ya existen` });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ INICIO DEL SERVIDOR ============
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('✅ Conectado a MongoDB Atlas');

        // Crear usuario admin por defecto si no existe
        const adminExists = await User.findOne({ email: 'admin@petcare.com' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('Admin123', 10);
            await User.create({
                nombre: 'Admin',
                apellido: 'PetCare',
                email: 'admin@petcare.com',
                telefono: '88888888',
                direccion: 'San José, Costa Rica',
                password: hashedPassword,
                rol: 'admin'
            });
            console.log('✅ Usuario admin creado (admin@petcare.com / Admin123)');
        }

        const clientExists = await User.findOne({ email: 'cliente@test.com' });
        if (!clientExists) {
            const hashedPassword = await bcrypt.hash('Cliente123', 10);
            await User.create({
                nombre: 'Cliente',
                apellido: 'Demo',
                email: 'cliente@test.com',
                telefono: '77777777',
                direccion: 'Heredia, Costa Rica',
                password: hashedPassword,
                rol: 'cliente'
            });
            console.log('✅ Usuario cliente creado (cliente@test.com / Cliente123)');
        }

        // Opcional: seed de productos si no hay ninguno
        const productCount = await Product.countDocuments();
        if (productCount === 0) {
            // Llamada interna al endpoint de seed
            fetch(`http://localhost:${PORT}/api/seed/products`, { method: 'POST' }).catch(console.error);
        }

        app.listen(PORT, () => {
            console.log('\n========================================');
            console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
            console.log('✅ MongoDB Atlas conectado');
            console.log('\n📝 Cuentas de prueba:');
            console.log('   Admin:  admin@petcare.com  /  Admin123');
            console.log('   Cliente: cliente@test.com  /  Cliente123');
            console.log('\n🔗 Probar API:');
            console.log(`   http://localhost:${PORT}/api/products`);
            console.log('========================================\n');
        });
    })
    .catch(error => {
        console.error('❌ Error conectando a MongoDB:', error.message);
        process.exit(1);
    });
