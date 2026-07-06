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

function loadData(filePath, defaultData) {
    try {
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(raw);
            if (Array.isArray(data)) return data;
        }
    } catch (err) {}
    return defaultData;
}

function saveData(filePath, data) {
    try { fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8'); } catch (err) {}
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'metelluscarlinsky@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'OGPLUG45';
const ADMIN_TOKEN = crypto.randomBytes(32).toString('hex');

const defaultProducts = [
    { id: 1, name: 'Sak Pay Deluxe', category: 'Atizana', price: 45, old_price: 65, stock: 50, badge: 'Nouvo', description: 'Sak pay atizanal fèt ak men.', image: 'logo.png', image_url: 'logo.png' },
    { id: 2, name: 'Chemiz Brode', category: 'Rad', price: 35, old_price: 50, stock: 100, badge: 'Popilè', description: 'Chemiz koton ak broderi.', image: 'logo.png', image_url: 'logo.png' },
    { id: 3, name: 'Tablo Dekoratif', category: 'Dekorasyon', price: 75, old_price: 95, stock: 25, badge: '', description: 'Tablo pentire ak men.', image: 'logo.png', image_url: 'logo.png' },
    { id: 4, name: 'Siwo Myèl Natirèl', category: 'Manje', price: 15, stock: 200, badge: 'Eko', description: 'Siwo myèl natirèl Ayiti.', image: 'logo.png', image_url: 'logo.png' },
];

let products = loadData(PRODUCTS_FILE, defaultProducts);
let orders = loadData(ORDERS_FILE, []);
let users = loadData(USERS_FILE, []);
let contacts = loadData(CONTACTS_FILE, []);

let productIdCounter = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 9;
let orderCounter = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1;
let userIdCounter = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;

const MIME = {
    '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};

function serveFile(res, filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'text/plain';
    fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }); res.end('<h1>404</h1>'); return; }
        res.writeHead(200, { 'Content-Type': contentType }); res.end(data);
    });
}

function getBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve({}); } });
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
        res.end(JSON.stringify({ name: 'OGSUN API', status: 'running', products: products.length }));
        return;
    }
    
    // Admin Login
    if (pathname === '/api/admin/login' && req.method === 'POST') {
        const body = await getBody(req);
        if (body.email === ADMIN_EMAIL && body.password === ADMIN_PASSWORD) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, token: ADMIN_TOKEN }));
        } else {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Imèl oswa kòd pa bon!' }));
        }
        return;
    }
    
    // Products GET ALL
    if (pathname === '/api/products' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(products));
        return;
    }
    
    // Product GET SINGLE
    const productMatch = pathname.match(/^\/api\/products\/(\d+)$/);
    if (productMatch && req.method === 'GET') {
        const p = products.find(pr => pr.id === parseInt(productMatch[1]));
        res.writeHead(p ? 200 : 404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(p || { error: 'Not found' }));
        return;
    }
    
    // Product CREATE
    if (pathname === '/api/products' && req.method === 'POST') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        const body = await getBody(req);
        const newP = {
            id: productIdCounter++,
            name: body.name || '', category: body.category || '',
            price: parseFloat(body.price) || 0,
            old_price: body.old_price ? parseFloat(body.old_price) : null,
            stock: parseInt(body.stock) || 0,
            badge: body.badge || '', description: body.description || '',
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
    
    // Product UPDATE
    if (productMatch && req.method === 'PUT') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        const id = parseInt(productMatch[1]);
        const body = await getBody(req);
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            products[index] = { ...products[index], ...body, id };
            saveData(PRODUCTS_FILE, products);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(products[index]));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not found' }));
        }
        return;
    }
    
    // Product DELETE
    if (productMatch && req.method === 'DELETE') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        const id = parseInt(productMatch[1]);
        products = products.filter(p => p.id !== id);
        saveData(PRODUCTS_FILE, products);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Efase!' }));
        return;
    }
    
    // Admin Stats
    if (pathname === '/api/admin/stats') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        const completed = orders.filter(o => o.status === 'completed');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            totalProducts: products.length, totalOrders: orders.length,
            totalRevenue: completed.reduce((s, o) => s + o.total, 0),
            pendingOrders: orders.filter(o => o.status === 'pending').length
        }));
        return;
    }
    
    // Orders CREATE
    if (pathname === '/api/orders' && req.method === 'POST') {
        const body = await getBody(req);
        const total = (body.items || []).reduce((s, i) => s + (i.price * i.quantity), 0);
        const order = {
            id: orderCounter++, order_number: 'OGS-' + Date.now().toString().slice(-6),
            customer_name: body.customer_name || '', customer_email: body.customer_email || '',
            customer_phone: body.customer_phone || '', shipping_address: body.shipping_address || '',
            payment_method: body.payment_method || '', total, status: 'pending',
            created_at: new Date().toISOString()
        };
        orders.unshift(order);
        saveData(ORDERS_FILE, orders);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Kòmand kreye!', order_number: order.order_number, total }));
        return;
    }
    
    // Orders GET ALL
    if (pathname === '/api/orders' && req.method === 'GET') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(orders));
        return;
    }
    
    // Order UPDATE
    const orderMatch = pathname.match(/^\/api\/orders\/(\d+)$/);
    if (orderMatch && req.method === 'PUT') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        const id = parseInt(orderMatch[1]);
        const body = await getBody(req);
        const order = orders.find(o => o.id === id);
        if (order) { order.status = body.status; saveData(ORDERS_FILE, orders); }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Mete ajou!' }));
        return;
    }
    
    // Users REGISTER
    if (pathname === '/api/users/register' && req.method === 'POST') {
        const body = await getBody(req);
        if (!body.name || !body.email || !body.password) { res.writeHead(400); res.end(JSON.stringify({error:'Chan obligatwa!'})); return; }
        const user = { id: userIdCounter++, name: body.name, email: body.email, password: body.password, phone: body.phone || '', created_at: new Date().toISOString() };
        users.push(user);
        saveData(USERS_FILE, users);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, user: { id: user.id, name: user.name, email: user.email } }));
        return;
    }
    
    // Users LOGIN
    if (pathname === '/api/users/login' && req.method === 'POST') {
        const body = await getBody(req);
        const user = users.find(u => u.email === body.email && u.password === body.password);
        if (user) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, user: { id: user.id, name: user.name, email: user.email } }));
        } else {
            res.writeHead(401); res.end(JSON.stringify({ success: false, error: 'Imèl/modpas pa bon!' }));
        }
        return;
    }
    
    // Users GET ALL
    if (pathname === '/api/users' && req.method === 'GET') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        const safe = users.map(u => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, created_at: u.created_at }));
        res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(safe));
        return;
    }
    
    // Users DELETE
    const userMatch = pathname.match(/^\/api\/users\/(\d+)$/);
    if (userMatch && req.method === 'DELETE') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        const id = parseInt(userMatch[1]);
        users = users.filter(u => u.id !== id);
        saveData(USERS_FILE, users);
        res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ message: 'Efase!' }));
        return;
    }
    
    // Contacts CREATE
    if (pathname === '/api/contacts' && req.method === 'POST') {
        const body = await getBody(req);
        contacts.unshift({ id: contacts.length + 1, ...body, created_at: new Date().toISOString() });
        saveData(CONTACTS_FILE, contacts);
        res.writeHead(201, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ message: 'Mesaj voye!' }));
        return;
    }
    
    // Contacts GET ALL
    if (pathname === '/api/contacts' && req.method === 'GET') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(contacts));
        return;
    }
    
    // Serve fichye statik
    let filePath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
    filePath = path.join(__dirname, '..', filePath);
    serveFile(res, filePath);
});

server.listen(PORT, HOST, () => {
    console.log('🚀 OGSUN SERVER AP MACHE! Pòt: ' + PORT + ' | Pwodwi: ' + products.length);
});