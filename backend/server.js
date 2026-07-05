const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Chemen fichye done yo
const PRODUCTS_FILE = path.join(__dirname, 'products.json');
const ORDERS_FILE = path.join(__dirname, 'orders.json');
const USERS_FILE = path.join(__dirname, 'users.json');
const CONTACTS_FILE = path.join(__dirname, 'contacts.json');

// ===== FONKSYON POU CHAJE AK SOve DONE =====
function loadData(filePath, defaultData) {
    try {
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(raw);
            if (Array.isArray(data) && data.length > 0) {
                console.log('✅ Chaje ' + data.length + ' antre depi ' + path.basename(filePath));
                return data;
            }
        }
    } catch (err) {
        console.log('⚠️ Erè chaje ' + path.basename(filePath) + ': ' + err.message);
    }
    console.log('📄 Itilize done defo pou ' + path.basename(filePath));
    return defaultData;
}

function saveData(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log('💾 Sove ' + data.length + ' antre nan ' + path.basename(filePath));
    } catch (err) {
        console.log('❌ Erè sove ' + path.basename(filePath) + ': ' + err.message);
    }
}

// ===== ADMIN KONFIGIRASYON =====
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'metelluscarlinsky@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'OGPLUG45';
const ADMIN_TOKEN = crypto.randomBytes(32).toString('hex');

// ===== DONE INISYAL =====
const defaultProducts = [
    { id: 1, name: 'Sak Pay Deluxe', category: 'Atizana', price: 45, old_price: 65, stock: 50, rating: 4.8, reviews: 128, badge: 'Nouvo', description: 'Sak pay atizanal fèt ak men.', image: 'logo.png', image_url: 'logo.png' },
    { id: 2, name: 'Chemiz Brode', category: 'Rad', price: 35, old_price: 50, stock: 100, rating: 4.7, reviews: 95, badge: 'Popilè', description: 'Chemiz koton ak broderi.', image: 'logo.png', image_url: 'logo.png' },
    { id: 3, name: 'Tablo Dekoratif', category: 'Dekorasyon', price: 75, old_price: 95, stock: 25, rating: 4.9, reviews: 72, badge: '', description: 'Tablo pentire ak men.', image: 'logo.png', image_url: 'logo.png' },
    { id: 4, name: 'Siwo Myèl Natirèl', category: 'Manje', price: 15, old_price: null, stock: 200, rating: 4.6, reviews: 200, badge: 'Eko', description: 'Siwo myèl natirèl Ayiti.', image: 'logo.png', image_url: 'logo.png' },
    { id: 5, name: 'Boutèy Resikle', category: 'Pwodwi Natirèl', price: 25, old_price: 35, stock: 75, rating: 4.5, reviews: 45, badge: 'Eko', description: 'Boutèy plastik resikle.', image: 'logo.png', image_url: 'logo.png' },
    { id: 6, name: 'Panyen Atizanal', category: 'Atizana', price: 55, old_price: 70, stock: 30, rating: 4.8, reviews: 88, badge: '', description: 'Panyen atizanal fèt ak men.', image: 'logo.png', image_url: 'logo.png' },
    { id: 7, name: 'Mayo Koton', category: 'Rad', price: 20, old_price: null, stock: 150, rating: 4.4, reviews: 150, badge: '', description: 'Mayo koton 100% natirèl.', image: 'logo.png', image_url: 'logo.png' },
    { id: 8, name: 'Kad Foto', category: 'Dekorasyon', price: 30, old_price: 40, stock: 40, rating: 4.7, reviews: 33, badge: 'Nouvo', description: 'Kad foto dekore ak men.', image: 'logo.png', image_url: 'logo.png' },
];

// ===== CHAJE TOUT DONE =====
let products = loadData(PRODUCTS_FILE, defaultProducts);
let orders = loadData(ORDERS_FILE, []);
let users = loadData(USERS_FILE, []);
let contacts = loadData(CONTACTS_FILE, []);

// ===== KONTE ID =====
let productIdCounter = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 9;
let orderCounter = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1;
let userIdCounter = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;

console.log('');
console.log('📊 REZIME DONE:');
console.log('  Pwodwi: ' + products.length);
console.log('  Kòmand: ' + orders.length);
console.log('  Itilizatè: ' + users.length);
console.log('  Kontak: ' + contacts.length);
console.log('');

// ===== MIME TYPES =====
const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

// ===== FONKSYON ITILITÈ =====
function serveFile(res, filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'text/plain';
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h1>404 - Paj pa jwenn</h1>');
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

function getBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try { resolve(JSON.parse(body)); }
            catch { resolve({}); }
        });
    });
}

function checkAdmin(req) {
    const auth = req.headers['authorization'];
    return auth && auth.replace('Bearer ', '') === ADMIN_TOKEN;
}

// ===== KREYE SÈVÈ =====
const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
    
    const myUrl = url.parse(req.url, true);
    const pathname = myUrl.pathname;
    
    console.log('📡 ' + req.method + ' ' + pathname);
    
    // ===== API INFO =====
    if (pathname === '/api') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ name: 'OGSUN API', status: 'running', products: products.length, orders: orders.length, users: users.length }));
        return;
    }
    
    // ===== ADMIN LOGIN =====
    if (pathname === '/api/admin/login' && req.method === 'POST') {
        const body = await getBody(req);
        if (body.email === ADMIN_EMAIL && body.password === ADMIN_PASSWORD) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, token: ADMIN_TOKEN, message: 'Byenveni Admin!' }));
            console.log('🔓 Admin konekte');
        } else {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Imèl oswa kòd pa bon!' }));
        }
        return;
    }
    
    // ===== ADMIN VERIFY TOKEN =====
    if (pathname === '/api/admin/verify' && req.method === 'GET') {
        res.writeHead(checkAdmin(req) ? 200 : 401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(checkAdmin(req) ? { valid: true, email: ADMIN_EMAIL } : { valid: false }));
        return;
    }
    
    // ===== PRODUCTS (GET ALL - PIBLIK) =====
    if (pathname === '/api/products' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(products));
        return;
    }
    
    // ===== PRODUCT (GET SINGLE) =====
    const productMatch = pathname.match(/^\/api\/products\/(\d+)$/);
    if (productMatch && req.method === 'GET') {
        const p = products.find(pr => pr.id === parseInt(productMatch[1]));
        res.writeHead(p ? 200 : 404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(p || { error: 'Not found' }));
        return;
    }
    
    // ===== PRODUCT (CREATE - ADMIN ONLY) =====
    if (pathname === '/api/products' && req.method === 'POST') {
        if (!checkAdmin(req)) { res.writeHead(401, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Admin only' })); return; }
        const body = await getBody(req);
        const newP = {
            id: productIdCounter++,
            name: body.name || '',
            category: body.category || '',
            price: parseFloat(body.price) || 0,
            old_price: body.old_price ? parseFloat(body.old_price) : null,
            stock: parseInt(body.stock) || 0,
            rating: 0,
            reviews: 0,
            badge: body.badge || '',
            description: body.description || '',
            image: body.image || body.image_url || 'logo.png',
            image_url: body.image_url || body.image || 'logo.png'
        };
        products.push(newP);
        saveData(PRODUCTS_FILE, products);
        console.log('✅ Pwodwi kreye: ' + newP.name);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newP));
        return;
    }
    
    // ===== PRODUCT (UPDATE - ADMIN ONLY) =====
    if (productMatch && req.method === 'PUT') {
        if (!checkAdmin(req)) { res.writeHead(401, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Admin only' })); return; }
        const id = parseInt(productMatch[1]);
        const body = await getBody(req);
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            products[index] = { ...products[index], ...body, id };
            saveData(PRODUCTS_FILE, products);
            console.log('✏️ Pwodwi modifye: #' + id);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(products[index]));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not found' }));
        }
        return;
    }
    
    // ===== PRODUCT (DELETE - ADMIN ONLY) =====
    if (productMatch && req.method === 'DELETE') {
        if (!checkAdmin(req)) { res.writeHead(401, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Admin only' })); return; }
        const id = parseInt(productMatch[1]);
        const productName = products.find(p => p.id === id)?.name;
        products = products.filter(p => p.id !== id);
        saveData(PRODUCTS_FILE, products);
        console.log('🗑️ Pwodwi efase: #' + id + ' - ' + productName);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Efase!', product: productName }));
        return;
    }
    
    // ===== ADMIN STATS =====
    if (pathname === '/api/admin/stats') {
        if (!checkAdmin(req)) { res.writeHead(401, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Admin only' })); return; }
        const completed = orders.filter(o => o.status === 'completed');
        const pending = orders.filter(o => o.status === 'pending');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            totalProducts: products.length,
            totalOrders: orders.length,
            totalRevenue: completed.reduce((s, o) => s + o.total, 0),
            pendingOrders: pending.length,
            conversionRate: orders.length ? ((completed.length / orders.length) * 100).toFixed(1) : 0
        }));
        return;
    }
    
    // ===== ORDERS (CREATE - PIBLIK) =====
    if (pathname === '/api/orders' && req.method === 'POST') {
        const body = await getBody(req);
        const items = body.items || [];
        const total = items.reduce((s, i) => s + (i.price * i.quantity), 0);
        const order = {
            id: orderCounter++,
            order_number: 'OGS-' + Date.now().toString().slice(-6),
            customer_name: body.customer_name || '',
            customer_email: body.customer_email || '',
            customer_phone: body.customer_phone || '',
            shipping_address: body.shipping_address || '',
            payment_method: body.payment_method || '',
            total,
            status: 'pending',
            created_at: new Date().toISOString()
        };
        orders.unshift(order);
        saveData(ORDERS_FILE, orders);
        console.log('🛒 Nouvo kòmand: ' + order.order_number + ' - $' + total);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Kòmand kreye!', order_number: order.order_number, total }));
        return;
    }
    
    // ===== ORDERS (GET ALL - ADMIN ONLY) =====
    if (pathname === '/api/orders' && req.method === 'GET') {
        if (!checkAdmin(req)) { res.writeHead(401, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Admin only' })); return; }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(orders));
        return;
    }
    
    // ===== ORDER (UPDATE STATUS - ADMIN ONLY) =====
    const orderMatch = pathname.match(/^\/api\/orders\/(\d+)$/);
    if (orderMatch && req.method === 'PUT') {
        if (!checkAdmin(req)) { res.writeHead(401, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Admin only' })); return; }
        const id = parseInt(orderMatch[1]);
        const body = await getBody(req);
        const order = orders.find(o => o.id === id);
        if (order) {
            order.status = body.status;
            saveData(ORDERS_FILE, orders);
            console.log('📋 Kòmand ' + order.order_number + ' => ' + order.status);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Mete ajou!', order: order.order_number, status: order.status }));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not found' }));
        }
        return;
    }
    
    // ===== USERS - REGISTER =====
    if (pathname === '/api/users/register' && req.method === 'POST') {
        const body = await getBody(req);
        if (!body.name || !body.email || !body.password) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Non, imèl, ak modpas obligatwa!' }));
            return;
        }
        if (users.find(u => u.email === body.email)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Imèl sa a deja itilize!' }));
            return;
        }
        const user = {
            id: userIdCounter++,
            name: body.name,
            email: body.email,
            password: body.password,
            phone: body.phone || '',
            address: body.address || '',
            created_at: new Date().toISOString()
        };
        users.push(user);
        saveData(USERS_FILE, users);
        console.log('👤 Nouvo itilizatè: ' + user.name);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Kont kreye!', user: { id: user.id, name: user.name, email: user.email } }));
        return;
    }
    
    // ===== USERS - LOGIN =====
    if (pathname === '/api/users/login' && req.method === 'POST') {
        const body = await getBody(req);
        const user = users.find(u => u.email === body.email && u.password === body.password);
        if (user) {
            const token = crypto.randomBytes(16).toString('hex');
            user.token = token;
            saveData(USERS_FILE, users);
            console.log('🔓 Itilizatè konekte: ' + user.email);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } }));
        } else {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Imèl oswa modpas pa bon!' }));
        }
        return;
    }
    
    // ===== USERS - GET ALL (ADMIN ONLY) =====
    if (pathname === '/api/users' && req.method === 'GET') {
        if (!checkAdmin(req)) { res.writeHead(401, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Admin only' })); return; }
        const safeUsers = users.map(u => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, created_at: u.created_at }));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(safeUsers));
        return;
    }
    
    // ===== USERS - DELETE (ADMIN ONLY) =====
    const userMatch = pathname.match(/^\/api\/users\/(\d+)$/);
    if (userMatch && req.method === 'DELETE') {
        if (!checkAdmin(req)) { res.writeHead(401, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Admin only' })); return; }
        const id = parseInt(userMatch[1]);
        const userName = users.find(u => u.id === id)?.name;
        users = users.filter(u => u.id !== id);
        saveData(USERS_FILE, users);
        console.log('🗑️ Itilizatè efase: ' + userName);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Efase!', user: userName }));
        return;
    }
    
    // ===== CONTACTS (CREATE - PIBLIK) =====
    if (pathname === '/api/contacts' && req.method === 'POST') {
        const body = await getBody(req);
        contacts.unshift({ id: contacts.length + 1, ...body, created_at: new Date().toISOString() });
        saveData(CONTACTS_FILE, contacts);
        console.log('📧 Nouvo mesaj: ' + (body.name || 'Anonim'));
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Mesaj voye!' }));
        return;
    }
    
    // ===== CONTACTS (GET ALL - ADMIN ONLY) =====
    if (pathname === '/api/contacts' && req.method === 'GET') {
        if (!checkAdmin(req)) { res.writeHead(401, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Admin only' })); return; }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(contacts));
        return;
    }
    
    // ===== SERVE FICHYE STATIK =====
    let filePath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
    filePath = path.join(__dirname, '..', filePath);
    serveFile(res, filePath);
});

// ===== KOUMANSE SÈVÈ =====
server.listen(PORT, HOST, () => {
    console.log('╔══════════════════════════════════════════╗');
    console.log('║   🚀 OGSUN SERVER AP MACHE!              ║');
    console.log('║   🌐 Port: ' + PORT + '                           ║');
    console.log('║   👑 Admin: ' + ADMIN_EMAIL + '        ║');
    console.log('║   💾 Pèsistans: FICHYE JSON aktiv       ║');
    console.log('║   📦 Pwodwi: ' + products.length + '                           ║');
    console.log('╚══════════════════════════════════════════╝');
});