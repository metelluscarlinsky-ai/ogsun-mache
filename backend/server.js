const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// ===== FIREBASE KONFIGIRASYON =====
const FIRESTORE_URL = 'https://firestore.googleapis.com/v1/projects/ogsun-mache-lakay-fe1c3/databases/(default)/documents';
const API_KEY = 'AIzaSyB5QeyFIh2Jej2McqnH2FkZNhtbTTq2Yb8';

// ===== ADMIN =====
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'metelluscarlinsky@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'OGPLUG45';
const ADMIN_TOKEN = crypto.randomBytes(32).toString('hex');

// ===== KACHE =====
let productsCache = [];
let ordersCache = [];
let usersCache = [];
let contactsCache = [];

let productIdCounter = 9;
let orderCounter = 1;
let userIdCounter = 1;

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

// ===== FIREBASE FONKSYON =====
function firebaseRequest(method, collection, id, data) {
    return new Promise((resolve, reject) => {
        let docUrl = `${FIRESTORE_URL}/${collection}`;
        if (id) docUrl += `/${id}`;
        docUrl += `?key=${API_KEY}`;
        
        const options = {
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };
        
        if (data) {
            const fields = {};
            for (const [key, value] of Object.entries(data)) {
                if (typeof value === 'string') fields[key] = { stringValue: value };
                else if (Number.isInteger(value)) fields[key] = { integerValue: String(value) };
                else if (typeof value === 'number') fields[key] = { doubleValue: value };
                else if (value === null || value === undefined) fields[key] = { nullValue: null };
            }
            options.body = JSON.stringify({ fields });
        }
        
        const req = http.request(docUrl, options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    if (method === 'GET' && !id) {
                        const docs = json.documents || [];
                        const items = docs.map(doc => {
                            const f = doc.fields || {};
                            const item = {};
                            for (const [k, v] of Object.entries(f)) {
                                const t = Object.keys(v)[0];
                                if (t === 'stringValue') item[k] = v.stringValue;
                                else if (t === 'integerValue') item[k] = parseInt(v.integerValue);
                                else if (t === 'doubleValue') item[k] = v.doubleValue;
                                else if (t === 'nullValue') item[k] = null;
                            }
                            item.id = parseInt(doc.name.split('/').pop()) || 0;
                            return item;
                        });
                        resolve(items);
                    } else {
                        resolve(json);
                    }
                } catch (e) {
                    resolve(method === 'GET' && !id ? [] : {});
                }
            });
        });
        
        req.on('error', (err) => {
            console.log('Firebase err:', err.message);
            resolve(method === 'GET' && !id ? [] : {});
        });
        
        if (data) req.write(options.body);
        req.end();
    });
}

async function firebaseGet(collection) {
    return await firebaseRequest('GET', collection, null, null);
}

async function firebaseSet(collection, id, data) {
    return await firebaseRequest('PATCH', collection, String(id), data);
}

async function firebaseDelete(collection, id) {
    return await firebaseRequest('DELETE', collection, String(id), null);
}

// ===== CHAJE DONE =====
async function loadData() {
    console.log('⏳ Chaje done depi Firebase...');
    
    try {
        productsCache = await firebaseGet('products');
        ordersCache = await firebaseGet('orders');
        usersCache = await firebaseGet('users');
        contactsCache = await firebaseGet('contacts');
        
        if (productsCache.length === 0) {
            console.log('📦 Kreye pwodwi defo...');
            const defaults = [
                { id: 1, name: 'Sak Pay Deluxe', category: 'Atizana', price: 45, old_price: 65, stock: 50, badge: 'Nouvo', description: 'Sak pay atizanal fèt ak men.', image: 'logo.png', image_url: 'logo.png' },
                { id: 2, name: 'Chemiz Brode', category: 'Rad', price: 35, old_price: 50, stock: 100, badge: 'Popilè', description: 'Chemiz koton ak broderi.', image: 'logo.png', image_url: 'logo.png' },
                { id: 3, name: 'Tablo Dekoratif', category: 'Dekorasyon', price: 75, old_price: 95, stock: 25, badge: '', description: 'Tablo pentire ak men.', image: 'logo.png', image_url: 'logo.png' },
                { id: 4, name: 'Siwo Myèl Natirèl', category: 'Manje', price: 15, stock: 200, badge: 'Eko', description: 'Siwo myèl natirèl Ayiti.', image: 'logo.png', image_url: 'logo.png' },
            ];
            for (const p of defaults) {
                await firebaseSet('products', String(p.id), p);
            }
            productsCache = defaults;
        }
        
        if (productsCache.length > 0) productIdCounter = Math.max(...productsCache.map(p => p.id)) + 1;
        if (ordersCache.length > 0) orderCounter = Math.max(...ordersCache.map(o => o.id)) + 1;
        if (usersCache.length > 0) userIdCounter = Math.max(...usersCache.map(u => u.id)) + 1;
        
        console.log('✅ Chaje: ' + productsCache.length + ' pwodwi, ' + ordersCache.length + ' kòmand');
    } catch (err) {
        console.log('⚠️ Erè:', err.message);
    }
}

// ===== FONKSYON =====
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

// ===== SÈVÈ =====
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
        res.end(JSON.stringify({ name: 'OGSUN API', status: 'running', storage: 'Firebase Firestore', products: productsCache.length }));
        return;
    }
    
    // ===== ADMIN LOGIN =====
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
    
    // ===== PRODUCTS (GET ALL) =====
    if (pathname === '/api/products' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(productsCache));
        return;
    }
    
    // ===== PRODUCT (GET SINGLE) =====
    const productMatch = pathname.match(/^\/api\/products\/(\d+)$/);
    if (productMatch && req.method === 'GET') {
        const p = productsCache.find(pr => pr.id === parseInt(productMatch[1]));
        res.writeHead(p ? 200 : 404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(p || { error: 'Not found' }));
        return;
    }
    
    // ===== PRODUCT (CREATE) =====
    if (pathname === '/api/products' && req.method === 'POST') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        const body = await getBody(req);
        const newP = {
            id: productIdCounter++,
            name: body.name || '',
            category: body.category || '',
            price: parseFloat(body.price) || 0,
            old_price: body.old_price ? parseFloat(body.old_price) : null,
            stock: parseInt(body.stock) || 0,
            badge: body.badge || '',
            description: body.description || '',
            image: body.image || body.image_url || 'logo.png',
            image_url: body.image_url || body.image || 'logo.png'
        };
        productsCache.push(newP);
        firebaseSet('products', String(newP.id), newP);
        console.log('✅ Pwodwi kreye: ' + newP.name);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newP));
        return;
    }
    
    // ===== PRODUCT (UPDATE) =====
    if (productMatch && req.method === 'PUT') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        const id = parseInt(productMatch[1]);
        const body = await getBody(req);
        const index = productsCache.findIndex(p => p.id === id);
        if (index !== -1) {
            productsCache[index] = { ...productsCache[index], ...body, id };
            firebaseSet('products', String(id), productsCache[index]);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(productsCache[index]));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not found' }));
        }
        return;
    }
    
    // ===== PRODUCT (DELETE) =====
    if (productMatch && req.method === 'DELETE') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        const id = parseInt(productMatch[1]);
        productsCache = productsCache.filter(p => p.id !== id);
        firebaseDelete('products', String(id));
        console.log('🗑️ Pwodwi efase nèt: #' + id);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Efase nèt! P ap janm remonte!' }));
        return;
    }
    
    // ===== ADMIN STATS =====
    if (pathname === '/api/admin/stats') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        const completed = ordersCache.filter(o => o.status === 'completed');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            totalProducts: productsCache.length,
            totalOrders: ordersCache.length,
            totalRevenue: completed.reduce((s, o) => s + o.total, 0),
            pendingOrders: ordersCache.filter(o => o.status === 'pending').length
        }));
        return;
    }
    
    // ===== ORDERS (CREATE) =====
    if (pathname === '/api/orders' && req.method === 'POST') {
        const body = await getBody(req);
        const total = (body.items || []).reduce((s, i) => s + (i.price * i.quantity), 0);
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
        ordersCache.unshift(order);
        firebaseSet('orders', String(order.id), order);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Kòmand kreye!', order_number: order.order_number, total }));
        return;
    }
    
    // ===== ORDERS (GET ALL) =====
    if (pathname === '/api/orders' && req.method === 'GET') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(ordersCache));
        return;
    }
    
    // ===== ORDER (UPDATE STATUS) =====
    const orderMatch = pathname.match(/^\/api\/orders\/(\d+)$/);
    if (orderMatch && req.method === 'PUT') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        const id = parseInt(orderMatch[1]);
        const body = await getBody(req);
        const order = ordersCache.find(o => o.id === id);
        if (order) { order.status = body.status; firebaseSet('orders', String(id), order); }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Mete ajou!' }));
        return;
    }
    
    // ===== USERS =====
    if (pathname === '/api/users/register' && req.method === 'POST') {
        const body = await getBody(req);
        if (!body.name || !body.email || !body.password) { res.writeHead(400); res.end(JSON.stringify({error:'Chan obligatwa!'})); return; }
        const user = { id: userIdCounter++, name: body.name, email: body.email, password: body.password, phone: body.phone || '', created_at: new Date().toISOString() };
        usersCache.push(user);
        firebaseSet('users', String(user.id), user);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, user: { id: user.id, name: user.name, email: user.email } }));
        return;
    }
    
    if (pathname === '/api/users/login' && req.method === 'POST') {
        const body = await getBody(req);
        const user = usersCache.find(u => u.email === body.email && u.password === body.password);
        res.writeHead(user ? 200 : 401, { 'Content-Type': 'application/json' });
        res.end(user ? JSON.stringify({ success: true, user: { id: user.id, name: user.name, email: user.email } }) : JSON.stringify({ success: false, error: 'Imèl/modpas pa bon!' }));
        return;
    }
    
    // ===== CONTACTS =====
    if (pathname === '/api/contacts' && req.method === 'POST') {
        const body = await getBody(req);
        const contact = { id: contactsCache.length + 1, ...body, created_at: new Date().toISOString() };
        contactsCache.unshift(contact);
        firebaseSet('contacts', String(contact.id), contact);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Mesaj voye!' }));
        return;
    }
    
    if (pathname === '/api/contacts' && req.method === 'GET') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(contactsCache));
        return;
    }
    
    // ===== SERVE FICHYE STATIK =====
    let filePath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
    filePath = path.join(__dirname, '..', filePath);
    serveFile(res, filePath);
});

// ===== KOUMANSE =====
loadData().then(() => {
    server.listen(PORT, HOST, () => {
        console.log('╔══════════════════════════════════════════╗');
        console.log('║   🚀 OGSUN + FIREBASE AP MACHE!          ║');
        console.log('║   💾 Done PÈMANAN - Google Cloud         ║');
        console.log('║   📦 Pwodwi: ' + productsCache.length + '                           ║');
        console.log('║   👑 Admin: ' + ADMIN_EMAIL + '        ║');
        console.log('╚══════════════════════════════════════════╝');
    });
});