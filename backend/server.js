const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'metelluscarlinsky@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'OGPLUG45';
const ADMIN_TOKEN = crypto.randomBytes(32).toString('hex');

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
let productIdCounter = 9;

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
            res.end('<h1>404 - Not Found</h1>');
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
        res.end(JSON.stringify({ name: 'OGSUN API', status: 'running', products: products.length, orders: orders.length }));
        return;
    }
    
    // Admin Login
    if (pathname === '/api/admin/login' && req.method === 'POST') {
        const body = await getBody(req);
        if (body.email === ADMIN_EMAIL && body.password === ADMIN_PASSWORD) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, token: ADMIN_TOKEN, message: '✅ Byenveni Admin!' }));
        } else {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: '❌ Imèl oswa kòd pa bon!' }));
        }
        return;
    }
    
    // Products (GET ALL)
    if (pathname === '/api/products' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(products));
        return;
    }
    
    // Product (GET SINGLE)
    const productMatch = pathname.match(/^\/api\/products\/(\d+)$/);
    if (productMatch && req.method === 'GET') {
        const p = products.find(pr => pr.id === parseInt(productMatch[1]));
        res.writeHead(p ? 200 : 404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(p || { error: 'Not found' }));
        return;
    }
    
    // Product (CREATE)
    if (pathname === '/api/products' && req.method === 'POST') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        const body = await getBody(req);
        const newP = {
            id: productIdCounter++,
            name: body.name || '',
            category: body.category || '',
            price: parseFloat(body.price) || 0,
            old_price: body.old_price || null,
            stock: parseInt(body.stock) || 0,
            badge: body.badge || '',
            description: body.description || ''
        };
        products.push(newP);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newP));
        return;
    }
    
    // Product (UPDATE)
    if (productMatch && req.method === 'PUT') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        const id = parseInt(productMatch[1]);
        const body = await getBody(req);
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            products[index] = { ...products[index], ...body, id };
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(products[index]));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not found' }));
        }
        return;
    }
    
    // Product (DELETE)
    if (productMatch && req.method === 'DELETE') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        const id = parseInt(productMatch[1]);
        products = products.filter(p => p.id !== id);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Deleted' }));
        return;
    }
    
    // Admin Stats
    if (pathname === '/api/admin/stats') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        const completed = orders.filter(o => o.status === 'completed');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            totalProducts: products.length,
            totalOrders: orders.length,
            totalRevenue: completed.reduce((s, o) => s + o.total, 0),
            pendingOrders: orders.filter(o => o.status === 'pending').length
        }));
        return;
    }
    
    // Orders (CREATE)
    if (pathname === '/api/orders' && req.method === 'POST') {
        const body = await getBody(req);
        const items = body.items || [];
        const total = items.reduce((s, i) => s + (i.price * i.quantity), 0);
        const order = {
            id: orderCounter++,
            order_number: 'OGS-' + Date.now().toString().slice(-6),
            customer_name: body.customer_name || '',
            customer_email: body.customer_email || '',
            total, status: 'pending',
            created_at: new Date().toISOString()
        };
        orders.unshift(order);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Order created!', order_number: order.order_number, total }));
        return;
    }
    
    // Orders (GET ALL)
    if (pathname === '/api/orders' && req.method === 'GET') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(orders));
        return;
    }
    
    // Order (UPDATE STATUS)
    const orderMatch = pathname.match(/^\/api\/orders\/(\d+)$/);
    if (orderMatch && req.method === 'PUT') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        const id = parseInt(orderMatch[1]);
        const body = await getBody(req);
        const order = orders.find(o => o.id === id);
        if (order) {
            order.status = body.status;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Updated' }));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not found' }));
        }
        return;
    }
    
    // Contacts (CREATE)
    if (pathname === '/api/contacts' && req.method === 'POST') {
        const body = await getBody(req);
        contacts.unshift({ id: contacts.length + 1, ...body, created_at: new Date().toISOString() });
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Sent!' }));
        return;
    }
    
    // Contacts (GET ALL)
    if (pathname === '/api/contacts' && req.method === 'GET') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(contacts));
        return;
    }
    
    // Serve Static Files
    let filePath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
    filePath = path.join(__dirname, filePath);
    serveFile(res, filePath);
});

server.listen(PORT, HOST, () => {
    console.log('🚀 OGSUN SERVER AP MACHE sou pòt ' + PORT);
    console.log('👑 Admin: ' + ADMIN_EMAIL);
});