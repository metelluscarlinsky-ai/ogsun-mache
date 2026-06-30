const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

const PORT = 3000;
const HOST = '0.0.0.0'; // ⚠️ 0.0.0.0 = aksepte tout koneksyon

const ADMIN_EMAIL = 'metelluscarlinsky@gmail.com';
const ADMIN_PASSWORD = 'OGPLUG45';
const ADMIN_TOKEN = crypto.randomBytes(32).toString('hex');

console.log('');
console.log('🔐 ADMIN: ' + ADMIN_EMAIL + ' / ' + ADMIN_PASSWORD);
console.log('🌐 Sèvè ap koute sou: ' + HOST + ':' + PORT);
console.log('');

let products = [
    { id: 1, name: 'Sak Pay Deluxe', category: 'Atizana', price: 45, old_price: 65, stock: 50, rating: 4.8, reviews: 128, badge: 'Nouvo', description: 'Sak pay atizanal fèt ak men.' },
    { id: 2, name: 'Chemiz Brode', category: 'Rad', price: 35, old_price: 50, stock: 100, rating: 4.7, reviews: 95, badge: 'Popilè', description: 'Chemiz koton ak broderi.' },
    { id: 3, name: 'Tablo Dekoratif', category: 'Dekorasyon', price: 75, old_price: 95, stock: 25, rating: 4.9, reviews: 72, badge: '', description: 'Tablo pentire ak men.' },
    { id: 4, name: 'Siwo Myèl Natirèl', category: 'Manje', price: 15, old_price: null, stock: 200, rating: 4.6, reviews: 200, badge: 'Eko', description: 'Siwo myèl natirèl Ayiti.' },
    { id: 5, name: 'Boutèy Resikle', category: 'Pwodwi Natirèl', price: 25, old_price: 35, stock: 75, rating: 4.5, reviews: 45, badge: 'Eko', description: 'Boutèy plastik resikle.' },
    { id: 6, name: 'Panyen Atizanal', category: 'Atizana', price: 55, old_price: 70, stock: 30, rating: 4.8, reviews: 88, badge: '', description: 'Panyen atizanal fèt ak men.' },
    { id: 7, name: 'Mayo Koton', category: 'Rad', price: 20, old_price: null, stock: 150, rating: 4.4, reviews: 150, badge: '', description: 'Mayo koton 100% natirèl.' },
    { id: 8, name: 'Kad Foto', category: 'Dekorasyon', price: 30, old_price: 40, stock: 40, rating: 4.7, reviews: 33, badge: 'Nouvo', description: 'Kad foto dekore ak men.' },
];

let orders = [];
let contacts = [];
let orderCounter = 1;

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

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
    
    const myUrl = url.parse(req.url, true);
    const pathname = myUrl.pathname;
    
    console.log('📡 ' + req.method + ' ' + pathname);
    
    // API Info
    if (pathname === '/api') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ name: 'OGSUN API', status: 'running', products: products.length, orders: orders.length, adminProtected: true }));
        return;
    }
    
    // Login
    if (pathname === '/api/admin/login' && req.method === 'POST') {
        const body = await getBody(req);
        if (body.email === ADMIN_EMAIL && body.password === ADMIN_PASSWORD) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, token: ADMIN_TOKEN, message: '✅ Byenveni Admin!' }));
            console.log('🔓 Admin konekte');
        } else {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: '❌ Imèl oswa kòd pa bon!' }));
        }
        return;
    }
    
    // Products (piblik)
    if (pathname === '/api/products' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(products));
        return;
    }
    
    // Admin Stats (pwoteje)
    if (pathname === '/api/admin/stats') {
        if (!checkAdmin(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '🔒 Admin access required' }));
            return;
        }
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
    
    // Orders (POST piblik, GET pwoteje)
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
            total, status: 'pending',
            created_at: new Date().toISOString()
        };
        orders.unshift(order);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Order created!', order_number: order.order_number, total }));
        console.log('🛒 Kòmand: ' + order.order_number);
        return;
    }
    
    if (pathname === '/api/orders' && req.method === 'GET') {
        if (!checkAdmin(req)) { res.writeHead(401, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Admin only' })); return; }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(orders));
        return;
    }
    
    // Contacts (POST piblik, GET pwoteje)
    if (pathname === '/api/contacts' && req.method === 'POST') {
        const body = await getBody(req);
        contacts.unshift({ id: contacts.length + 1, ...body, created_at: new Date().toISOString() });
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Sent!' }));
        return;
    }
    
    if (pathname === '/api/contacts' && req.method === 'GET') {
        if (!checkAdmin(req)) { res.writeHead(401, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Admin only' })); return; }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(contacts));
        return;
    }
    
    // Static files
    let filePath = pathname === '/' ? 'index.html' : pathname;
    filePath = path.join(__dirname, '..', filePath);
    serveFile(res, filePath);
});

// ⚠️ 0.0.0.0 = aksepte tout koneksyon (WiFi, 4G, elatriye)
server.listen(PORT, HOST, () => {
    console.log('╔══════════════════════════════════════════╗');
    console.log('║   🚀 OGSUN SERVER AP MACHE!              ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log('║ 🌐 Local:  http://localhost:' + PORT);
    console.log('║ 🌐 Rezo:   http://10.84.117.117:' + PORT);
    console.log('║ 📡 API:    http://localhost:' + PORT + '/api');
    console.log('║ 👑 Admin:  http://localhost:' + PORT + '/admin-login.html');
    console.log('╠══════════════════════════════════════════╣');
    console.log('║ 🔐 Login: ' + ADMIN_EMAIL);
    console.log('║ 🔑 Kòd:   ' + ADMIN_PASSWORD);
    console.log('╚══════════════════════════════════════════╝');
    console.log('');
});
