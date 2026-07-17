const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Fichye done
const PRODUCTS_FILE = path.join(__dirname, 'products.json');
const ORDERS_FILE = path.join(__dirname, 'orders.json');
const USERS_FILE = path.join(__dirname, 'users.json');
const CONTACTS_FILE = path.join(__dirname, 'contacts.json');
const SUPPLIERS_FILE = path.join(__dirname, 'suppliers.json');
const TRANSACTIONS_FILE = path.join(__dirname, 'transactions.json');

function loadData(filePath, defaultData) {
    try { if (fs.existsSync(filePath)) { const d = JSON.parse(fs.readFileSync(filePath, 'utf8')); if (Array.isArray(d)) return d; } } catch (e) {}
    return defaultData;
}
function saveData(filePath, data) { try { fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8'); } catch (e) {} }

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'metelluscarlinsky@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'OGPLUG45';
const ADMIN_TOKEN = crypto.randomBytes(32).toString('hex');

const defaultSuppliers = [
    { id: 1, name: 'CJ Dropshipping', type: 'dropshipping', website: 'https://cjdropshipping.com', api_key: '', active: true, logo: 'logo.png', description: 'Founisè entènasyonal #1 pou dropshipping' },
    { id: 2, name: 'AliExpress', type: 'dropshipping', website: 'https://aliexpress.com', api_key: '', active: false, logo: 'logo.png', description: 'Founisè Chinwa ak anpil pwodwi' },
    { id: 3, name: 'Founisè Lokal Ayiti', type: 'local', website: '', api_key: '', active: false, logo: 'logo.png', description: 'Atizan lokal Ayiti' },
];

const defaultProducts = [
    { id: 1, name: 'Sak Pay Deluxe', category: 'Atizana', price: 45, old_price: 65, stock: 50, badge: 'Nouvo', description: 'Sak pay atizanal fèt ak men.', image: 'logo.png', image_url: 'logo.png', source: 'manual', supplier_id: null, cj_url: '', supplier_price: null, profit: null },
    { id: 2, name: 'Chemiz Brode', category: 'Rad', price: 35, old_price: 50, stock: 100, badge: 'Popilè', description: 'Chemiz koton ak broderi.', image: 'logo.png', image_url: 'logo.png', source: 'manual', supplier_id: null, cj_url: '', supplier_price: null, profit: null },
    { id: 3, name: 'Tablo Dekoratif', category: 'Dekorasyon', price: 75, old_price: 95, stock: 25, badge: '', description: 'Tablo pentire ak men.', image: 'logo.png', image_url: 'logo.png', source: 'manual', supplier_id: null, cj_url: '', supplier_price: null, profit: null },
    { id: 4, name: 'Siwo Myèl Natirèl', category: 'Manje', price: 15, stock: 200, badge: 'Eko', description: 'Siwo myèl natirèl Ayiti.', image: 'logo.png', image_url: 'logo.png', source: 'manual', supplier_id: null, cj_url: '', supplier_price: null, profit: null },
];

let products = loadData(PRODUCTS_FILE, defaultProducts);
let orders = loadData(ORDERS_FILE, []);
let users = loadData(USERS_FILE, []);
let contacts = loadData(CONTACTS_FILE, []);
let suppliers = loadData(SUPPLIERS_FILE, defaultSuppliers);
let transactions = loadData(TRANSACTIONS_FILE, []);

let productIdCounter = Math.max(...products.map(p => p.id), 8) + 1;
let orderCounter = Math.max(...orders.map(o => o.id), 0) + 1;
let userIdCounter = Math.max(...users.map(u => u.id), 0) + 1;
let supplierIdCounter = Math.max(...suppliers.map(s => s.id), 2) + 1;
let transactionIdCounter = Math.max(...transactions.map(t => t.id), 0) + 1;

const MIME = {
    '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};

function serveFile(res, filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const ct = MIME[ext] || 'text/plain';
    fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }); res.end('<h1>404</h1>'); return; }
        res.writeHead(200, { 'Content-Type': ct }); res.end(data);
    });
}
function getBody(req) {
    return new Promise((resolve) => {
        let body = ''; req.on('data', c => body += c);
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
    
    // ===== API INFO =====
    if (pathname === '/api') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ name: 'OGSUN API', status: 'running', products: products.length, orders: orders.length, suppliers: suppliers.length, features: ['CJ Dropshipping', 'PayPal', 'Stripe', 'NatCash', 'WhatsApp'] }));
        return;
    }
    
    // ===== ADMIN =====
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
    
    if (pathname === '/api/admin/verify' && req.method === 'GET') {
        res.writeHead(checkAdmin(req) ? 200 : 401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(checkAdmin(req) ? { valid: true } : { valid: false }));
        return;
    }
    
    // ===== PRODUCTS =====
    if (pathname === '/api/products' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(products)); return;
    }
    
    const productMatch = pathname.match(/^\/api\/products\/(\d+)$/);
    if (productMatch && req.method === 'GET') {
        const p = products.find(pr => pr.id === parseInt(productMatch[1]));
        res.writeHead(p ? 200 : 404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(p || { error: 'Not found' })); return;
    }
    
    if (pathname === '/api/products' && req.method === 'POST') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        const body = await getBody(req);
        const np = {
            id: productIdCounter++, name: body.name || '', category: body.category || '',
            price: parseFloat(body.price) || 0, old_price: body.old_price ? parseFloat(body.old_price) : null,
            stock: parseInt(body.stock) || 0, badge: body.badge || '', description: body.description || '',
            image: body.image || body.image_url || 'logo.png', image_url: body.image_url || body.image || 'logo.png',
            source: body.source || 'manual', supplier_id: body.supplier_id || null,
            cj_url: body.cj_url || '', supplier_price: body.supplier_price ? parseFloat(body.supplier_price) : null,
            profit: body.supplier_price ? ((parseFloat(body.price) || 0) - parseFloat(body.supplier_price)) : null
        };
        products.push(np); saveData(PRODUCTS_FILE, products);
        res.writeHead(201, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(np)); return;
    }
    
    if (productMatch && req.method === 'PUT') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        const id = parseInt(productMatch[1]); const body = await getBody(req);
        const idx = products.findIndex(p => p.id === id);
        if (idx !== -1) {
            products[idx] = { ...products[idx], ...body, id };
            if (body.supplier_price) products[idx].profit = (products[idx].price || 0) - parseFloat(body.supplier_price);
            saveData(PRODUCTS_FILE, products);
            res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(products[idx]));
        } else { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Not found' })); }
        return;
    }
    
    if (productMatch && req.method === 'DELETE') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        products = products.filter(p => p.id !== parseInt(productMatch[1]));
        saveData(PRODUCTS_FILE, products);
        res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ message: 'Efase!' })); return;
    }
    
    // ===== SUPPLIERS =====
    if (pathname === '/api/suppliers' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(suppliers)); return;
    }
    
    const supplierMatch = pathname.match(/^\/api\/suppliers\/(\d+)$/);
    if (supplierMatch && req.method === 'GET') {
        const s = suppliers.find(su => su.id === parseInt(supplierMatch[1]));
        res.writeHead(s ? 200 : 404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(s || { error: 'Not found' })); return;
    }
    
    if (pathname === '/api/suppliers' && req.method === 'POST') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        const body = await getBody(req);
        const ns = { id: supplierIdCounter++, name: body.name || '', type: body.type || 'dropshipping', website: body.website || '', api_key: body.api_key || '', active: body.active !== false, logo: body.logo || 'logo.png', description: body.description || '' };
        suppliers.push(ns); saveData(SUPPLIERS_FILE, suppliers);
        res.writeHead(201, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(ns)); return;
    }
    
    if (supplierMatch && req.method === 'PUT') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        const id = parseInt(supplierMatch[1]); const body = await getBody(req);
        const idx = suppliers.findIndex(s => s.id === id);
        if (idx !== -1) { suppliers[idx] = { ...suppliers[idx], ...body, id }; saveData(SUPPLIERS_FILE, suppliers); res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(suppliers[idx])); }
        else { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Not found' })); }
        return;
    }
    
    if (supplierMatch && req.method === 'DELETE') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        suppliers = suppliers.filter(s => s.id !== parseInt(supplierMatch[1]));
        saveData(SUPPLIERS_FILE, suppliers);
        res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ message: 'Efase!' })); return;
    }
    
    // Supplier SEARCH
    const supplierSearchMatch = pathname.match(/^\/api\/suppliers\/(\d+)\/search$/);
    if (supplierSearchMatch && req.method === 'POST') {
        const body = await getBody(req);
        const keyword = (body.keyword || '').toLowerCase();
        const mock = [
            { id: 'cj-001', name: 'Sak Pay Atizanal', price: 12.50, shipping: 5, stock: 500, image: 'logo.png', cj_url: 'https://cjdropshipping.com/product/sak-pay' },
            { id: 'cj-002', name: 'Chemiz Brode Koton', price: 8, shipping: 3.50, stock: 1000, image: 'logo.png', cj_url: 'https://cjdropshipping.com/product/chemiz' },
            { id: 'cj-003', name: 'Tablo Dekoratif', price: 22, shipping: 8, stock: 200, image: 'logo.png', cj_url: 'https://cjdropshipping.com/product/tablo' },
            { id: 'cj-004', name: 'Siwo Myèl Natirèl', price: 5, shipping: 2, stock: 800, image: 'logo.png', cj_url: 'https://cjdropshipping.com/product/siwo' },
            { id: 'cj-005', name: 'Boutèy Plastik Resikle', price: 10, shipping: 4, stock: 300, image: 'logo.png', cj_url: 'https://cjdropshipping.com/product/boutey' },
        ];
        const filtered = keyword ? mock.filter(p => p.name.toLowerCase().includes(keyword)) : mock;
        res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ products: filtered })); return;
    }
    
    // Supplier IMPORT
    const supplierImportMatch = pathname.match(/^\/api\/suppliers\/(\d+)\/import$/);
    if (supplierImportMatch && req.method === 'POST') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        const supplierId = parseInt(supplierImportMatch[1]);
        const body = await getBody(req);
        const np = {
            id: productIdCounter++, name: body.name || 'Pwodwi Founisè', category: body.category || 'Dropshipping',
            price: parseFloat(body.price) || 0, stock: parseInt(body.stock) || 999, badge: body.badge || 'CJ',
            description: body.description || 'Pwodwi enpòte depi founisè.', image: body.image || 'logo.png', image_url: body.image || 'logo.png',
            source: 'supplier', supplier_id: supplierId, cj_url: body.cj_url || '', supplier_price: parseFloat(body.supplier_price) || parseFloat(body.price) || 0,
            profit: ((parseFloat(body.price) || 0) - (parseFloat(body.supplier_price) || parseFloat(body.price) || 0))
        };
        products.push(np); saveData(PRODUCTS_FILE, products);
        res.writeHead(201, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ success: true, product: np })); return;
    }
    
    // ===== ADMIN STATS =====
    if (pathname === '/api/admin/stats') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        const completed = orders.filter(o => o.status === 'completed');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            totalProducts: products.length, totalOrders: orders.length,
            totalRevenue: completed.reduce((s, o) => s + o.total, 0),
            pendingOrders: orders.filter(o => o.status === 'pending').length,
            totalSuppliers: suppliers.length, activeSuppliers: suppliers.filter(s => s.active).length
        })); return;
    }
    
    // ===== ORDERS =====
    if (pathname === '/api/orders' && req.method === 'POST') {
        const body = await getBody(req); const items = body.items || [];
        const total = items.reduce((s, i) => s + (i.price * i.quantity), 0);
        const order = { id: orderCounter++, order_number: 'OGS-' + Date.now().toString().slice(-6), customer_name: body.customer_name || '', customer_email: body.customer_email || '', customer_phone: body.customer_phone || '', shipping_address: body.shipping_address || '', payment_method: body.payment_method || 'whatsapp', total, status: 'pending', created_at: new Date().toISOString() };
        orders.unshift(order); saveData(ORDERS_FILE, orders);
        const trans = { id: transactionIdCounter++, order_number: order.order_number, amount: total, method: body.payment_method || 'whatsapp', status: 'pending', created_at: new Date().toISOString() };
        transactions.unshift(trans); saveData(TRANSACTIONS_FILE, transactions);
        res.writeHead(201, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ message: 'Kòmand kreye!', order_number: order.order_number, total })); return;
    }
    
    if (pathname === '/api/orders' && req.method === 'GET') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(orders)); return;
    }
    
    const orderMatch = pathname.match(/^\/api\/orders\/(\d+)$/);
    if (orderMatch && req.method === 'PUT') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        const order = orders.find(o => o.id === parseInt(orderMatch[1]));
        if (order) { order.status = (await getBody(req)).status; saveData(ORDERS_FILE, orders); }
        res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ message: 'Mete ajou!' })); return;
    }
    
    // ===== USERS =====
    if (pathname === '/api/users/register' && req.method === 'POST') {
        const body = await getBody(req);
        if (!body.name || !body.email || !body.password) { res.writeHead(400); res.end(JSON.stringify({error:'Chan obligatwa!'})); return; }
        const user = { id: userIdCounter++, name: body.name, email: body.email, password: body.password, phone: body.phone || '', created_at: new Date().toISOString() };
        users.push(user); saveData(USERS_FILE, users);
        res.writeHead(201, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ success: true, user: { id: user.id, name: user.name, email: user.email } })); return;
    }
    
    if (pathname === '/api/users/login' && req.method === 'POST') {
        const body = await getBody(req);
        const user = users.find(u => u.email === body.email && u.password === body.password);
        res.writeHead(user ? 200 : 401, { 'Content-Type': 'application/json' });
        res.end(user ? JSON.stringify({ success: true, user: { id: user.id, name: user.name, email: user.email } }) : JSON.stringify({ success: false, error: 'Imèl/modpas pa bon!' })); return;
    }
    
    if (pathname === '/api/users' && req.method === 'GET') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(users.map(u => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, created_at: u.created_at })))); return;
    }
    
    const userMatch = pathname.match(/^\/api\/users\/(\d+)$/);
    if (userMatch && req.method === 'DELETE') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        users = users.filter(u => u.id !== parseInt(userMatch[1]));
        saveData(USERS_FILE, users); res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ message: 'Efase!' })); return;
    }
    
    // ===== CONTACTS =====
    if (pathname === '/api/contacts' && req.method === 'POST') {
        const body = await getBody(req);
        contacts.unshift({ id: contacts.length + 1, ...body, created_at: new Date().toISOString() });
        saveData(CONTACTS_FILE, contacts); res.writeHead(201, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ message: 'Mesaj voye!' })); return;
    }
    
    if (pathname === '/api/contacts' && req.method === 'GET') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(contacts)); return;
    }
    
    // ===== TRANSACTIONS =====
    if (pathname === '/api/transactions' && req.method === 'GET') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(transactions)); return;
    }
    
    // ===== SERVE STATIK =====
    let filePath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
    filePath = path.join(__dirname, '..', filePath);
    serveFile(res, filePath);
});

server.listen(PORT, HOST, () => {
    console.log('🚀 OGSUN SERVER AK FOUNISÈ + CJ AP MACHE!');
    console.log('📦 Pwodwi: ' + products.length + ' | 🏭 Founisè: ' + suppliers.length);
});
