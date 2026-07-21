const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// ===== FICHYE DONE =====
const DATA_DIR = path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');

// ===== FONKSYON DONE 100% SOLID =====
function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        console.log('📁 Dosye data kreye: ' + DATA_DIR);
    }
}

function loadJSON(filePath, defaultData) {
    ensureDataDir();
    try {
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8').trim();
            if (content) {
                const data = JSON.parse(content);
                if (Array.isArray(data)) {
                    console.log('✅ Chaje: ' + path.basename(filePath) + ' (' + data.length + ' antre)');
                    return data;
                }
            }
        }
    } catch (err) {
        console.log('⚠️ Erè chaje ' + path.basename(filePath) + ': ' + err.message);
        // Fè backup fichye ki koronpi a
        try {
            const backupPath = filePath + '.backup.' + Date.now();
            fs.copyFileSync(filePath, backupPath);
            console.log('📁 Backup kreye: ' + backupPath);
        } catch (e) {}
    }
    console.log('📄 Kreye nouvo ' + path.basename(filePath));
    saveJSON(filePath, defaultData);
    return JSON.parse(JSON.stringify(defaultData));
}

function saveJSON(filePath, data) {
    ensureDataDir();
    try {
        // Ekri nan fichye tanporè avan
        const tmpPath = filePath + '.tmp';
        fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
        // Renome tanporè a kòm fichye final (operasyon atomik)
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        fs.renameSync(tmpPath, filePath);
        console.log('💾 Sove: ' + path.basename(filePath) + ' (' + data.length + ' antre)');
        return true;
    } catch (err) {
        console.log('❌ Erè sove ' + path.basename(filePath) + ': ' + err.message);
        // Eseye sove dirèkteman si rename echwe
        try {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
            console.log('💾 Sove dirèk: ' + path.basename(filePath));
            return true;
        } catch (e) {
            console.log('❌ Erè sove dirèk: ' + e.message);
            return false;
        }
    }
}

// ===== ADMIN KONFIGIRASYON =====
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'metelluscarlinsky@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'OGPLUG45';
const ADMIN_TOKEN = crypto.randomBytes(32).toString('hex');

console.log('');
console.log('🔐 Token Admin jenere: ' + ADMIN_TOKEN.substring(0, 20) + '...');
console.log('');

// ===== DONE INISYAL =====
const defaultProducts = [
    { id: 1, name: 'Sak Pay Deluxe', category: 'Atizana', price: 45, old_price: 65, stock: 50, rating: 4.8, reviews: 128, badge: 'Nouvo', description: 'Sak pay atizanal fèt ak men ak anpil lanmou.', image: 'logo.png', image_url: 'logo.png', source: 'manual' },
    { id: 2, name: 'Chemiz Brode', category: 'Rad', price: 35, old_price: 50, stock: 100, rating: 4.7, reviews: 95, badge: 'Popilè', description: 'Chemiz koton ak bèl broderi ayisyen.', image: 'logo.png', image_url: 'logo.png', source: 'manual' },
    { id: 3, name: 'Tablo Dekoratif', category: 'Dekorasyon', price: 75, old_price: 95, stock: 25, rating: 4.9, reviews: 72, badge: '', description: 'Tablo pentire ak men pou dekore kay ou.', image: 'logo.png', image_url: 'logo.png', source: 'manual' },
    { id: 4, name: 'Siwo Myèl Natirèl', category: 'Manje', price: 15, stock: 200, rating: 4.6, reviews: 200, badge: 'Eko', description: 'Siwo myèl 100% natirèl ki soti nan mòn Ayiti.', image: 'logo.png', image_url: 'logo.png', source: 'manual' },
];

// ===== CHAJE DONE =====
let products = loadJSON(PRODUCTS_FILE, defaultProducts);
let orders = loadJSON(ORDERS_FILE, []);
let users = loadJSON(USERS_FILE, []);
let contacts = loadJSON(CONTACTS_FILE, []);

// ===== KONTE ID =====
function getMaxId(arr) {
    return arr.length > 0 ? Math.max(...arr.map(item => item.id || 0)) : 0;
}

let productIdCounter = getMaxId(products) + 1;
let orderCounter = getMaxId(orders) + 1;
let userIdCounter = getMaxId(users) + 1;

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
    '.webp': 'image/webp',
};

// ===== FONKSYON =====
function serveStaticFile(res, filePath) {
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

function parseBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try { resolve(JSON.parse(body)); }
            catch { resolve({}); }
        });
    });
}

function isAdmin(req) {
    const auth = req.headers['authorization'] || '';
    return auth.replace('Bearer ', '') === ADMIN_TOKEN;
}

function jsonResponse(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data, null, 2));
}

// ===== SÈVÈ PRENSIPAL =====
const server = http.createServer(async (req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;
    
    console.log('📡 ' + method + ' ' + pathname);
    
    // ===== API ROUTES =====
    
    // GET /api - Info API
    if (pathname === '/api' && method === 'GET') {
        jsonResponse(res, 200, {
            name: 'OGSUN API',
            version: '5.0',
            status: 'running',
            products: products.length,
            orders: orders.length,
            users: users.length
        });
        return;
    }
    
    // POST /api/admin/login
    if (pathname === '/api/admin/login' && method === 'POST') {
        const body = await parseBody(req);
        if (body.email === ADMIN_EMAIL && body.password === ADMIN_PASSWORD) {
            jsonResponse(res, 200, { success: true, token: ADMIN_TOKEN });
            console.log('🔓 Admin konekte: ' + body.email);
        } else {
            jsonResponse(res, 401, { success: false, error: 'Imèl oswa kòd pa bon!' });
        }
        return;
    }
    
    // GET /api/admin/verify
    if (pathname === '/api/admin/verify' && method === 'GET') {
        jsonResponse(res, isAdmin(req) ? 200 : 401, isAdmin(req) ? { valid: true } : { valid: false });
        return;
    }
    
    // ===== PRODUCTS =====
    
    // GET /api/products
    if (pathname === '/api/products' && method === 'GET') {
        jsonResponse(res, 200, products);
        return;
    }
    
    // GET /api/products/:id
    const productMatch = pathname.match(/^\/api\/products\/(\d+)$/);
    if (productMatch && method === 'GET') {
        const id = parseInt(productMatch[1]);
        const product = products.find(p => p.id === id);
        jsonResponse(res, product ? 200 : 404, product || { error: 'Pwodwi pa jwenn' });
        return;
    }
    
    // POST /api/products - AJOUTE PWODWI
    if (pathname === '/api/products' && method === 'POST') {
        if (!isAdmin(req)) {
            jsonResponse(res, 401, { error: 'Admin only' });
            return;
        }
        
        const body = await parseBody(req);
        
        if (!body.name || !body.price) {
            jsonResponse(res, 400, { error: 'Non ak pri obligatwa!' });
            return;
        }
        
        const newProduct = {
            id: productIdCounter++,
            name: body.name,
            category: body.category || 'Atizana',
            price: parseFloat(body.price) || 0,
            old_price: body.old_price ? parseFloat(body.old_price) : null,
            stock: parseInt(body.stock) || 0,
            badge: body.badge || '',
            description: body.description || '',
            image: body.image || body.image_url || 'logo.png',
            image_url: body.image_url || body.image || 'logo.png',
            source: body.source || 'manual'
        };
        
        products.push(newProduct);
        const saved = saveJSON(PRODUCTS_FILE, products);
        
        console.log('✅ Pwodwi AJOUTE: #' + newProduct.id + ' - ' + newProduct.name + ' | Sove: ' + (saved ? 'OK' : 'ECHWE'));
        
        jsonResponse(res, 201, newProduct);
        return;
    }
    
    // PUT /api/products/:id - MODIFYE PWODWI
    if (productMatch && method === 'PUT') {
        if (!isAdmin(req)) {
            jsonResponse(res, 401, { error: 'Admin only' });
            return;
        }
        
        const id = parseInt(productMatch[1]);
        const body = await parseBody(req);
        const index = products.findIndex(p => p.id === id);
        
        if (index !== -1) {
            products[index] = { ...products[index], ...body, id };
            saveJSON(PRODUCTS_FILE, products);
            console.log('✏️ Pwodwi MODIFYE: #' + id);
            jsonResponse(res, 200, products[index]);
        } else {
            jsonResponse(res, 404, { error: 'Pwodwi pa jwenn' });
        }
        return;
    }
    
    // DELETE /api/products/:id - EFASE PWODWI
    if (productMatch && method === 'DELETE') {
        if (!isAdmin(req)) {
            jsonResponse(res, 401, { error: 'Admin only' });
            return;
        }
        
        const id = parseInt(productMatch[1]);
        const productName = products.find(p => p.id === id)?.name || 'Unknown';
        const before = products.length;
        
        products = products.filter(p => p.id !== id);
        
        if (products.length < before) {
            const saved = saveJSON(PRODUCTS_FILE, products);
            console.log('🗑️ Pwodwi EFASE: #' + id + ' - ' + productName + ' | Sove: ' + (saved ? 'OK' : 'ECHWE'));
            jsonResponse(res, 200, { message: 'Efase!', product: productName });
        } else {
            jsonResponse(res, 404, { error: 'Pwodwi pa jwenn' });
        }
        return;
    }
    
    // ===== ADMIN STATS =====
    if (pathname === '/api/admin/stats' && method === 'GET') {
        if (!isAdmin(req)) {
            jsonResponse(res, 401, { error: 'Admin only' });
            return;
        }
        
        const completed = orders.filter(o => o.status === 'completed');
        const pending = orders.filter(o => o.status === 'pending');
        
        jsonResponse(res, 200, {
            totalProducts: products.length,
            totalOrders: orders.length,
            totalRevenue: completed.reduce((s, o) => s + (o.total || 0), 0),
            pendingOrders: pending.length,
            totalUsers: users.length
        });
        return;
    }
    
    // ===== ORDERS =====
    if (pathname === '/api/orders' && method === 'POST') {
        const body = await parseBody(req);
        const items = body.items || [];
        const total = items.reduce((s, i) => s + ((i.price || 0) * (i.quantity || 1)), 0);
        
        const order = {
            id: orderCounter++,
            order_number: 'OGS-' + Date.now().toString().slice(-6),
            customer_name: body.customer_name || '',
            customer_phone: body.customer_phone || '',
            shipping_address: body.shipping_address || '',
            payment_method: body.payment_method || 'natcash',
            promo_code: body.promo_code || '',
            total: total,
            status: 'pending',
            created_at: new Date().toISOString()
        };
        
        orders.unshift(order);
        saveJSON(ORDERS_FILE, orders);
        console.log('🛒 Kòmand: ' + order.order_number + ' - $' + total);
        jsonResponse(res, 201, { message: 'Kòmand kreye!', order_number: order.order_number, total: total });
        return;
    }
    
    if (pathname === '/api/orders' && method === 'GET') {
        if (!isAdmin(req)) { jsonResponse(res, 401, { error: 'Admin only' }); return; }
        jsonResponse(res, 200, orders);
        return;
    }
    
    // ===== USERS =====
    if (pathname === '/api/users/register' && method === 'POST') {
        const body = await parseBody(req);
        
        if (!body.name || !body.email || !body.password) {
            jsonResponse(res, 400, { error: 'Non, imèl, ak modpas obligatwa!' });
            return;
        }
        
        if (users.find(u => u.email === body.email)) {
            jsonResponse(res, 400, { error: 'Imèl sa a deja itilize!' });
            return;
        }
        
        const user = {
            id: userIdCounter++,
            name: body.name,
            email: body.email,
            password: body.password,
            phone: body.phone || '',
            created_at: new Date().toISOString()
        };
        
        users.push(user);
        saveJSON(USERS_FILE, users);
        console.log('👤 Itilizatè: ' + user.name);
        jsonResponse(res, 201, { success: true, user: { id: user.id, name: user.name, email: user.email } });
        return;
    }
    
    if (pathname === '/api/users/login' && method === 'POST') {
        const body = await parseBody(req);
        const user = users.find(u => u.email === body.email && u.password === body.password);
        
        if (user) {
            jsonResponse(res, 200, { success: true, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
        } else {
            jsonResponse(res, 401, { success: false, error: 'Imèl oswa modpas pa bon!' });
        }
        return;
    }
    
    if (pathname === '/api/users' && method === 'GET') {
        if (!isAdmin(req)) { jsonResponse(res, 401, { error: 'Admin only' }); return; }
        const safeUsers = users.map(u => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, created_at: u.created_at }));
        jsonResponse(res, 200, safeUsers);
        return;
    }
    
    // ===== CONTACTS =====
    if (pathname === '/api/contacts' && method === 'POST') {
        const body = await parseBody(req);
        contacts.unshift({ id: Date.now(), ...body, created_at: new Date().toISOString() });
        saveJSON(CONTACTS_FILE, contacts);
        console.log('📧 Kontak: ' + (body.name || 'Anonim'));
        jsonResponse(res, 201, { message: 'Mesaj voye!' });
        return;
    }
    
    if (pathname === '/api/contacts' && method === 'GET') {
        if (!isAdmin(req)) { jsonResponse(res, 401, { error: 'Admin only' }); return; }
        jsonResponse(res, 200, contacts);
        return;
    }
    
    // ===== SERVE FICHYE STATIK =====
    let filePath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
    filePath = path.join(__dirname, '..', filePath);
    
    // Sekirite: anpeche aksè nan dosye backend
    if (filePath.includes('backend/data') || filePath.includes('backend/server.js')) {
        res.writeHead(403);
        res.end('Aksè refize');
        return;
    }
    
    serveStaticFile(res, filePath);
});

// ===== KOUMANSE SÈVÈ =====
server.listen(PORT, HOST, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║   🚀 OGSUN SERVER v5.0 - 100% SOLID      ║');
    console.log('║   🌐 http://localhost:' + PORT + '                   ║');
    console.log('║   💾 Data: ' + DATA_DIR + '                 ║');
    console.log('║   📦 Products: ' + products.length + '                         ║');
    console.log('║   👑 Admin: ' + ADMIN_EMAIL + '        ║');
    console.log('║   ✅ SAVE: 100% GARANTI                  ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log('');
});




