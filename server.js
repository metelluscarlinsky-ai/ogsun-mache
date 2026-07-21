const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// ===== SQLite DATABASE =====
const Database = require('better-sqlite3');
const DB_FILE = path.join(__dirname, 'ogsun.db');

// Kreye/konekte bazdone
const db = new Database(DB_FILE);

// Kreye tab yo
db.exec(`
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT DEFAULT 'Atizana',
        price REAL DEFAULT 0,
        old_price REAL,
        stock INTEGER DEFAULT 0,
        badge TEXT DEFAULT '',
        description TEXT DEFAULT '',
        image TEXT DEFAULT 'logo.png',
        image_url TEXT DEFAULT 'logo.png',
        source TEXT DEFAULT 'manual',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
CREATE TABLE IF NOT EXISTS visitors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page TEXT DEFAULT 'unknown',
    device TEXT DEFAULT 'desktop',
    ip TEXT DEFAULT 'unknown',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT UNIQUE NOT NULL,
        customer_name TEXT DEFAULT '',
        customer_phone TEXT DEFAULT '',
        shipping_address TEXT DEFAULT '',
        payment_method TEXT DEFAULT 'natcash',
        promo_code TEXT DEFAULT '',
        total REAL DEFAULT 0,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS promos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        affiliate_name TEXT NOT NULL,
        phone TEXT DEFAULT '',
        natcash TEXT DEFAULT '',
        comm2k REAL DEFAULT 500,
        comm4k REAL DEFAULT 1000,
        comm7k REAL DEFAULT 1500,
        comm9k REAL DEFAULT 2000,
        active INTEGER DEFAULT 1,
        orders_count INTEGER DEFAULT 0,
        revenue REAL DEFAULT 0,
        commission REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT DEFAULT '',
        email TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        message TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

// Enseri pwodwi defo si pa gen anyen
const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
if (productCount === 0) {
    const insertProduct = db.prepare('INSERT INTO products (name, category, price, old_price, stock, badge, description) VALUES (?, ?, ?, ?, ?, ?, ?)');
    insertProduct.run('Sak Pay Deluxe', 'Atizana', 45, 65, 50, 'Nouvo', 'Sak pay atizanal fèt ak men.');
    insertProduct.run('Chemiz Brode', 'Rad', 35, 50, 100, 'Popilè', 'Chemiz koton ak broderi.');
    insertProduct.run('Tablo Dekoratif', 'Dekorasyon', 75, 95, 25, '', 'Tablo pentire ak men.');
    insertProduct.run('Siwo Myèl Natirèl', 'Manje', 15, null, 200, 'Eko', 'Siwo myèl natirèl Ayiti.');
    console.log('✅ Pwodwi defo kreye!');
}

// Enseri kòd promo defo si pa gen anyen
const promoCount = db.prepare('SELECT COUNT(*) as count FROM promos').get().count;
if (promoCount === 0) {
    const insertPromo = db.prepare('INSERT INTO promos (code, affiliate_name, comm2k, comm4k, comm7k, comm9k) VALUES (?, ?, ?, ?, ?, ?)');
    for (let i = 1; i <= 10; i++) {
        insertPromo.run('OGSUN-PRO' + i, 'Afilye #' + i, 500, 1000, 1500, 2000);
    }
    console.log('✅ 10 kòd promo kreye!');
}

// ===== USERS (deja egziste) =====
if (pathname === '/api/users' && method === 'GET') {
    if (!isAdmin(req)) { jsonRes(res, 401, { error: 'Admin only' }); return; }
    const users = db.prepare('SELECT id, name, email, phone, created_at FROM users ORDER BY id DESC').all();
    jsonRes(res, 200, users);
    return;
}

// ===== ADMIN =====
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'metelluscarlinsky@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'OGPLUG45';
const ADMIN_TOKEN = crypto.randomBytes(32).toString('hex');

// ===== MIME =====
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
    const ct = MIME[ext] || 'text/plain';
    fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end('404'); return; }
        res.writeHead(200, { 'Content-Type': ct });
        res.end(data);
    });
}

function getBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', c => body += c);
        req.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve({}); } });
    });
}

function isAdmin(req) {
    const auth = req.headers['authorization'] || '';
    return auth.replace('Bearer ', '') === ADMIN_TOKEN;
}

function jsonRes(res, code, data) {
    res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
}

// ===== SÈVÈ =====
const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
    
    const pUrl = url.parse(req.url, true);
    const pathname = pUrl.pathname;
    const method = req.method;
    
    console.log('📡 ' + method + ' ' + pathname);
    
    // ===== API =====
    if (pathname === '/api') {
        jsonRes(res, 200, { name: 'OGSUN API', version: '6.0', storage: 'SQLite', products: db.prepare('SELECT COUNT(*) as c FROM products').get().c });
        return;
    }
    
    // ===== ADMIN LOGIN =====
    if (pathname === '/api/admin/login' && method === 'POST') {
        const b = await getBody(req);
        if (b.email === ADMIN_EMAIL && b.password === ADMIN_PASSWORD) {
            jsonRes(res, 200, { success: true, token: ADMIN_TOKEN });
        } else {
            jsonRes(res, 401, { success: false, error: 'Imèl oswa kòd pa bon!' });
        }
        return;
    }
    
    // ===== PRODUCTS =====
    if (pathname === '/api/products' && method === 'GET') {
        const products = db.prepare('SELECT * FROM products ORDER BY id DESC').all();
        jsonRes(res, 200, products);
        return;
    }
    
    if (pathname === '/api/products' && method === 'POST') {
        if (!isAdmin(req)) { jsonRes(res, 401, { error: 'Admin only' }); return; }
        const b = await getBody(req);
        if (!b.name || !b.price) { jsonRes(res, 400, { error: 'Non ak pri obligatwa!' }); return; }
        
        const result = db.prepare('INSERT INTO products (name, category, price, old_price, stock, badge, description, image, image_url, source) VALUES (?,?,?,?,?,?,?,?,?,?)')
            .run(b.name, b.category || 'Atizana', parseFloat(b.price) || 0, b.old_price || null, parseInt(b.stock) || 0, b.badge || '', b.description || '', b.image || 'logo.png', b.image_url || 'logo.png', b.source || 'manual');
        
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
        console.log('✅ Pwodwi AJOUTE: #' + product.id + ' - ' + product.name);
        jsonRes(res, 201, product);
        return;
    }
    
    const productMatch = pathname.match(/^\/api\/products\/(\d+)$/);
    if (productMatch) {
        const id = parseInt(productMatch[1]);
        
        if (method === 'GET') {
            const p = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
            jsonRes(res, p ? 200 : 404, p || { error: 'Pa jwenn' });
            return;
        }
        
        if (method === 'PUT') {
            if (!isAdmin(req)) { jsonRes(res, 401, { error: 'Admin only' }); return; }
            const b = await getBody(req);
            db.prepare('UPDATE products SET name=?, category=?, price=?, old_price=?, stock=?, badge=?, description=?, image=?, image_url=? WHERE id=?')
                .run(b.name, b.category, b.price, b.old_price, b.stock, b.badge, b.description, b.image || b.image_url, b.image_url || b.image, id);
            const p = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
            console.log('✏️ Pwodwi MODIFYE: #' + id);
            jsonRes(res, 200, p);
            return;
        }
        
        if (method === 'DELETE') {
            if (!isAdmin(req)) { jsonRes(res, 401, { error: 'Admin only' }); return; }
            const p = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
            db.prepare('DELETE FROM products WHERE id = ?').run(id);
            console.log('🗑️ Pwodwi EFASE: #' + id + ' - ' + (p?.name || 'Unknown'));
            jsonRes(res, 200, { message: 'Efase nèt!' });
            return;
        }
    }
    
    // ===== PROMOS =====
    if (pathname === '/api/promos' && method === 'GET') {
        const promos = db.prepare('SELECT * FROM promos ORDER BY id').all();
        jsonRes(res, 200, promos);
        return;
    }
    
    if (pathname === '/api/promos/verify' && method === 'POST') {
        const b = await getBody(req);
        const promo = db.prepare('SELECT * FROM promos WHERE code = ? AND affiliate_name = ? AND active = 1').get(b.code?.toUpperCase(), b.name);
        jsonRes(res, promo ? 200 : 401, promo || { error: 'Non oswa kòd pa valab!' });
        return;
    }
    
    if (pathname === '/api/promos' && method === 'POST') {
        if (!isAdmin(req)) { jsonRes(res, 401, { error: 'Admin only' }); return; }
        const b = await getBody(req);
        const result = db.prepare('INSERT INTO promos (code, affiliate_name, phone, natcash, comm2k, comm4k, comm7k, comm9k) VALUES (?,?,?,?,?,?,?,?)')
            .run(b.code?.toUpperCase(), b.affiliate_name, b.phone || '', b.natcash || '', b.comm2k || 500, b.comm4k || 1000, b.comm7k || 1500, b.comm9k || 2000);
        jsonRes(res, 201, db.prepare('SELECT * FROM promos WHERE id = ?').get(result.lastInsertRowid));
        return;
    }
    
    // ===== ADMIN STATS =====
    if (pathname === '/api/admin/stats') {
        if (!isAdmin(req)) { jsonRes(res, 401, { error: 'Admin only' }); return; }
        jsonRes(res, 200, {
            totalProducts: db.prepare('SELECT COUNT(*) as c FROM products').get().c,
            totalOrders: db.prepare('SELECT COUNT(*) as c FROM orders').get().c,
            totalRevenue: db.prepare("SELECT COALESCE(SUM(total),0) as t FROM orders WHERE status='completed'").get().t,
            pendingOrders: db.prepare("SELECT COUNT(*) as c FROM orders WHERE status='pending'").get().c,
            totalUsers: db.prepare('SELECT COUNT(*) as c FROM users').get().c,
            totalPromos: db.prepare('SELECT COUNT(*) as c FROM promos WHERE active=1').get().c
        });
        return;
    }
    
    // ===== ORDERS =====
    if (pathname === '/api/orders' && method === 'POST') {
        const b = await getBody(req);
        const total = (b.items || []).reduce((s, i) => s + ((i.price || 0) * (i.quantity || 1)), 0);
        const orderNumber = 'OGS-' + Date.now().toString().slice(-6);
        db.prepare('INSERT INTO orders (order_number, customer_name, customer_phone, shipping_address, payment_method, promo_code, total) VALUES (?,?,?,?,?,?,?)')
            .run(orderNumber, b.customer_name || '', b.customer_phone || '', b.shipping_address || '', b.payment_method || 'natcash', b.promo_code || '', total);
        console.log('🛒 Kòmand: ' + orderNumber);
        jsonRes(res, 201, { message: 'Kòmand kreye!', order_number: orderNumber, total });
        return;
    }
    
    if (pathname === '/api/orders' && method === 'GET') {
        if (!isAdmin(req)) { jsonRes(res, 401, { error: 'Admin only' }); return; }
        jsonRes(res, 200, db.prepare('SELECT * FROM orders ORDER BY id DESC').all());
        return;
    }
    
    // ===== USERS =====
    if (pathname === '/api/users/register' && method === 'POST') {
        const b = await getBody(req);
        if (!b.name || !b.email || !b.password) { jsonRes(res, 400, { error: 'Non, imèl, modpas obligatwa!' }); return; }
        if (db.prepare('SELECT id FROM users WHERE email = ?').get(b.email)) { jsonRes(res, 400, { error: 'Imèl deja itilize!' }); return; }
        db.prepare('INSERT INTO users (name, email, password, phone) VALUES (?,?,?,?)').run(b.name, b.email, b.password, b.phone || '');
        const user = db.prepare('SELECT id, name, email, phone, created_at FROM users WHERE email = ?').get(b.email);
        console.log('👤 Itilizatè: ' + user.name);
        jsonRes(res, 201, { success: true, user });
        return;
    }
    
    if (pathname === '/api/users/login' && method === 'POST') {
        const b = await getBody(req);
        const user = db.prepare('SELECT id, name, email, phone FROM users WHERE email = ? AND password = ?').get(b.email, b.password);
        jsonRes(res, user ? 200 : 401, user ? { success: true, user } : { error: 'Imèl oswa modpas pa bon!' });
        return;
    }
    
    if (pathname === '/api/users' && method === 'GET') {
        if (!isAdmin(req)) { jsonRes(res, 401, { error: 'Admin only' }); return; }
        jsonRes(res, 200, db.prepare('SELECT id, name, email, phone, created_at FROM users ORDER BY id DESC').all());
        return;
    }
    
    // ===== CONTACTS =====
    if (pathname === '/api/contacts' && method === 'POST') {
        const b = await getBody(req);
        db.prepare('INSERT INTO contacts (name, email, phone, message) VALUES (?,?,?,?)').run(b.name || '', b.email || '', b.phone || '', b.message || '');
        jsonRes(res, 201, { message: 'Mesaj voye!' });
        return;
    }
// ===== VISITORS =====
if (pathname === '/api/visitors' && method === 'POST') {
    const b = await getBody(req);
    db.prepare('INSERT INTO visitors (page, device, ip) VALUES (?, ?, ?)').run(
        b.page || 'unknown',
        b.device || 'desktop',
        b.ip || 'unknown'
    );
    jsonRes(res, 201, { message: 'Vizit anrejistre!' });
    return;
}

if (pathname === '/api/visitors' && method === 'GET') {
    if (!isAdmin(req)) { jsonRes(res, 401, { error: 'Admin only' }); return; }
    
    const total = db.prepare('SELECT COUNT(*) as c FROM visitors').get().c;
    const today = db.prepare("SELECT COUNT(*) as c FROM visitors WHERE date(created_at) = date('now')").get().c;
    const mobile = db.prepare("SELECT COUNT(*) as c FROM visitors WHERE device = 'mobile'").get().c;
    const recent = db.prepare('SELECT * FROM visitors ORDER BY id DESC LIMIT 20').all();
    
    jsonRes(res, 200, { total, today, mobile, desktop: total - mobile, recent });
    return;
}
    
    // ===== SERVE STATIK =====
    let filePath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
    filePath = path.join(__dirname, '..', filePath);
    serveFile(res, filePath);
});

server.listen(PORT, HOST, () => {
    console.log('');
    console.log('🚀 OGSUN SERVER v6.0 - SQLite DATABASE');
    console.log('💾 Database: ' + DB_FILE);
    console.log('✅ Pwodwi: ' + db.prepare('SELECT COUNT(*) as c FROM products').get().c);
    console.log('✅ Kòd Promo: ' + db.prepare('SELECT COUNT(*) as c FROM promos').get().c);
    console.log('');
});
