const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
const DATA_DIR = path.join(__dirname, 'data');

const ADMIN_EMAIL = 'metelluscarlinsky@gmail.com';
const ADMIN_PASSWORD = 'OGPLUG45';
const ADMIN_TOKEN = crypto.randomBytes(32).toString('hex');

// ===== DATABASE NAN MEMWA + FICHYE =====
let DB = {
    products: [],
    orders: [],
    users: [],
    promos: [],
    contacts: [],
    visitors: []
};

// ===== FONKSYON DATABASE SOLID =====
function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        console.log('📁 Dosye data kreye: ' + DATA_DIR);
    }
}

function loadCollection(name, defaultData) {
    ensureDataDir();
    const filePath = path.join(DATA_DIR, name + '.json');
    try {
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8').trim();
            if (content) {
                const data = JSON.parse(content);
                if (Array.isArray(data) && data.length > 0) {
                    console.log('✅ Chaje ' + name + ': ' + data.length + ' antre');
                    return data;
                }
            }
        }
    } catch (err) {
        console.log('⚠️ Erè chaje ' + name + ': ' + err.message);
        // Eseye backup
        try {
            const backupPath = filePath + '.backup';
            if (fs.existsSync(backupPath)) {
                const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
                console.log('📁 Restore depi backup: ' + backupPath);
                return Array.isArray(backupData) ? backupData : defaultData;
            }
        } catch (e) {}
    }
    console.log('📄 ' + name + ': Kreye ak done defo (' + defaultData.length + ' antre)');
    return JSON.parse(JSON.stringify(defaultData));
}

function saveCollection(name) {
    ensureDataDir();
    const filePath = path.join(DATA_DIR, name + '.json');
    const data = DB[name];
    try {
        // Backup ansyen fichye
        if (fs.existsSync(filePath)) {
            fs.copyFileSync(filePath, filePath + '.backup');
        }
        // Ekri nouvo done
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log('💾 Sove ' + name + ': ' + data.length + ' antre');
        return true;
    } catch (err) {
        console.log('❌ Erè sove ' + name + ': ' + err.message);
        return false;
    }
}

// ===== DONE INISYAL =====
const defaultProducts = [
    { id: 1, name: 'Sak Pay Deluxe', category: 'Atizana', price: 45, old_price: 65, stock: 50, badge: 'Nouvo', description: 'Sak pay atizanal fèt ak men.', image: 'logo.png', image_url: 'logo.png' },
    { id: 2, name: 'Chemiz Brode', category: 'Rad', price: 35, old_price: 50, stock: 100, badge: 'Popilè', description: 'Chemiz koton ak broderi.', image: 'logo.png', image_url: 'logo.png' },
    { id: 3, name: 'Tablo Dekoratif', category: 'Dekorasyon', price: 75, old_price: 95, stock: 25, badge: '', description: 'Tablo pentire ak men.', image: 'logo.png', image_url: 'logo.png' },
    { id: 4, name: 'Siwo Myèl Natirèl', category: 'Manje', price: 15, stock: 200, badge: 'Eko', description: 'Siwo myèl natirèl Ayiti.', image: 'logo.png', image_url: 'logo.png' },
];

const defaultPromos = [];
for (let i = 1; i <= 10; i++) {
    defaultPromos.push({
        id: i, code: 'OGSUN-PRO' + i, affiliate_name: 'Afilye #' + i,
        phone: '', natcash: '', comm2k: 500, comm4k: 1000, comm7k: 1500, comm9k: 2000,
        active: true, orders_count: 0, revenue: 0, commission: 0
    });
}

// ===== CHAJE TOUT DONE =====
DB.products = loadCollection('products', defaultProducts);
DB.orders = loadCollection('orders', []);
DB.users = loadCollection('users', []);
DB.promos = loadCollection('promos', defaultPromos);
DB.contacts = loadCollection('contacts', []);
DB.visitors = loadCollection('visitors', []);

// ===== ID COUNTERS =====
function getNextId(collection) {
    return collection.length > 0 ? Math.max(...collection.map(item => item.id || 0)) + 1 : 1;
}

// ===== MIME =====
const MIME = {
    '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp',
};

function serveFile(res, filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const ct = MIME[ext] || 'text/plain';
    fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }); res.end('<h1>404 - Paj pa jwenn</h1>'); return; }
        res.writeHead(200, { 'Content-Type': ct }); res.end(data);
    });
}

function parseBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', c => { body += c; });
        req.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve({}); } });
    });
}

function isAdmin(req) {
    const auth = req.headers['authorization'] || '';
    return auth.replace('Bearer ', '') === ADMIN_TOKEN;
}

function json(res, code, data) {
    res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data, null, 2));
}

// ===== SÈVÈ =====
const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
    
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;
    console.log('📡 ' + method + ' ' + pathname);
    
    // ===== API INFO =====
    if (pathname === '/api') {
        json(res, 200, { name: 'OGSUN API', version: '8.0', status: 'running', products: DB.products.length, orders: DB.orders.length, users: DB.users.length, promos: DB.promos.length, visitors: DB.visitors.length });
        return;
    }
    
    // ===== ADMIN LOGIN =====
    if (pathname === '/api/admin/login' && method === 'POST') {
        const body = await parseBody(req);
        if (body.email === ADMIN_EMAIL && body.password === ADMIN_PASSWORD) {
            json(res, 200, { success: true, token: ADMIN_TOKEN, message: 'Byenveni Admin!' });
        } else {
            json(res, 401, { success: false, error: 'Imèl oswa kòd pa bon!' });
        }
        return;
    }
    
    // ===== ADMIN VERIFY =====
    if (pathname === '/api/admin/verify' && method === 'GET') {
        json(res, isAdmin(req) ? 200 : 401, isAdmin(req) ? { valid: true } : { valid: false });
        return;
    }
    
    // ===== ADMIN STATS =====
    if (pathname === '/api/admin/stats' && method === 'GET') {
        if (!isAdmin(req)) { json(res, 401, { error: 'Admin only' }); return; }
        const completed = DB.orders.filter(o => o.status === 'completed');
        json(res, 200, {
            totalProducts: DB.products.length, totalOrders: DB.orders.length,
            totalRevenue: completed.reduce((s, o) => s + (o.total || 0), 0),
            pendingOrders: DB.orders.filter(o => o.status === 'pending').length,
            totalUsers: DB.users.length, totalPromos: DB.promos.filter(p => p.active).length,
            totalVisitors: DB.visitors.length
        });
        return;
    }
    
    // ===== PRODUCTS =====
    if (pathname === '/api/products' && method === 'GET') { json(res, 200, DB.products); return; }
    
    const productMatch = pathname.match(/^\/api\/products\/(\d+)$/);
    
    if (pathname === '/api/products' && method === 'POST') {
        if (!isAdmin(req)) { json(res, 401, { error: 'Admin only' }); return; }
        const body = await parseBody(req);
        if (!body.name || !body.price) { json(res, 400, { error: 'Non ak pri obligatwa!' }); return; }
        const newP = { id: getNextId(DB.products), name: body.name, category: body.category || 'Atizana', price: parseFloat(body.price) || 0, old_price: body.old_price ? parseFloat(body.old_price) : null, stock: parseInt(body.stock) || 0, badge: body.badge || '', description: body.description || '', image: body.image || body.image_url || 'logo.png', image_url: body.image_url || body.image || 'logo.png' };
        DB.products.push(newP); saveCollection('products');
        console.log('✅ Pwodwi AJOUTE: #' + newP.id + ' - ' + newP.name);
        json(res, 201, newP); return;
    }
    
    if (productMatch) {
        const id = parseInt(productMatch[1]);
        if (method === 'GET') { const p = DB.products.find(pr => pr.id === id); json(res, p ? 200 : 404, p || { error: 'Pa jwenn' }); return; }
        if (method === 'PUT') {
            if (!isAdmin(req)) { json(res, 401, { error: 'Admin only' }); return; }
            const body = await parseBody(req);
            const idx = DB.products.findIndex(p => p.id === id);
            if (idx !== -1) { DB.products[idx] = { ...DB.products[idx], ...body, id }; saveCollection('products'); console.log('✏️ Pwodwi MODIFYE: #' + id); json(res, 200, DB.products[idx]); }
            else { json(res, 404, { error: 'Pa jwenn' }); }
            return;
        }
        if (method === 'DELETE') {
            if (!isAdmin(req)) { json(res, 401, { error: 'Admin only' }); return; }
            const before = DB.products.length;
            DB.products = DB.products.filter(p => p.id !== id);
            if (DB.products.length < before) { saveCollection('products'); console.log('🗑️ Pwodwi EFASE: #' + id); json(res, 200, { message: 'Efase nèt!' }); }
            else { json(res, 404, { error: 'Pa jwenn' }); }
            return;
        }
    }
    
    // ===== PROMOS (KÒRÈKTE) =====
    if (pathname === '/api/promos' && method === 'GET') { json(res, 200, DB.promos); return; }
    
    // ✅ ROUTE VERIFYE AFILYE - KÒRÈKTE
    if (pathname === '/api/promos/verify' && method === 'POST') {
        const body = await parseBody(req);
        const inputCode = (body.code || '').trim().toUpperCase();
        
        console.log('🔍 Verifye kòd afilye: "' + inputCode + '"');
        console.log('📋 Kòd ki disponib: ' + DB.promos.filter(p => p.active).map(p => p.code).join(', '));
        
        // Chèche kòd la - verifye tou 2 bò nan majiskil
        const promo = DB.promos.find(p => {
            const promoCode = (p.code || '').toUpperCase().trim();
            const isActive = p.active === true || p.active === 1;
            return promoCode === inputCode && isActive;
        });
        
        if (promo) {
            console.log('✅ Afilye jwenn: ' + promo.affiliate_name + ' (Kòd: ' + promo.code + ')');
            json(res, 200, promo);
        } else {
            // Debug: montre ki kòd ki disponib
            const available = DB.promos.filter(p => p.active === true || p.active === 1)
                .map(p => p.code + ' (' + p.affiliate_name + ')');
            console.log('❌ Kòd pa jwenn: ' + inputCode);
            console.log('📋 Disponib: ' + available.join(', '));
            
            json(res, 200, { 
                error: 'Kòd pa valab!',
                code_entered: inputCode,
                available_codes: available
            });
        }
        return;
    }
    
    if (pathname === '/api/promos' && method === 'POST') {
        if (!isAdmin(req)) { json(res, 401, { error: 'Admin only' }); return; }
        const body = await parseBody(req);
        const newPromo = {
            id: getNextId(DB.promos),
            code: (body.code || '').toUpperCase().trim(),
            affiliate_name: body.affiliate_name || body.affiliate || '',
            phone: body.phone || '', natcash: body.natcash || '',
            comm2k: parseInt(body.comm2k) || 500, comm4k: parseInt(body.comm4k) || 1000,
            comm7k: parseInt(body.comm7k) || 1500, comm9k: parseInt(body.comm9k) || 2000,
            active: true, orders_count: 0, revenue: 0, commission: 0
        };
        DB.promos.push(newPromo); saveCollection('promos');
        console.log('✅ Kòd promo AJOUTE: ' + newPromo.code);
        json(res, 201, newPromo); return;
    }
    
    // ===== ORDERS =====
    if (pathname === '/api/orders' && method === 'GET') { if (!isAdmin(req)) { json(res, 401, { error: 'Admin only' }); return; } json(res, 200, DB.orders); return; }
    
    if (pathname === '/api/orders' && method === 'POST') {
        const body = await parseBody(req);
        const items = body.items || [];
        const total = items.reduce((s, i) => s + ((i.price || 0) * (i.quantity || 1)), 0);
        const order = {
            id: getNextId(DB.orders), order_number: 'OGS-' + Date.now().toString().slice(-6),
            customer_name: body.customer_name || '', customer_phone: body.customer_phone || '',
            shipping_address: body.shipping_address || '', payment_method: body.payment_method || 'natcash',
            promo_code: body.promo_code || '', total: total, status: 'pending',
            created_at: new Date().toISOString()
        };
        DB.orders.unshift(order); saveCollection('orders');
        console.log('🛒 Kòmand: ' + order.order_number + ' - $' + total);
        json(res, 201, { message: 'Kòmand kreye!', order_number: order.order_number, total: total }); return;
    }
    
    // ===== USERS =====
    if (pathname === '/api/users/register' && method === 'POST') {
        const body = await parseBody(req);
        if (!body.name || !body.email || !body.password) { json(res, 400, { error: 'Non, imèl, modpas obligatwa!' }); return; }
        if (DB.users.find(u => u.email === body.email)) { json(res, 400, { error: 'Imèl deja itilize!' }); return; }
        const user = { id: getNextId(DB.users), name: body.name, email: body.email, password: body.password, phone: body.phone || '', created_at: new Date().toISOString() };
        DB.users.push(user); saveCollection('users');
        json(res, 201, { success: true, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } }); return;
    }
    
    if (pathname === '/api/users/login' && method === 'POST') {
        const body = await parseBody(req);
        const user = DB.users.find(u => u.email === body.email && u.password === body.password);
        json(res, user ? 200 : 401, user ? { success: true, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } } : { success: false, error: 'Imèl oswa modpas pa bon!' }); return;
    }
    
    if (pathname === '/api/users' && method === 'GET') {
        if (!isAdmin(req)) { json(res, 401, { error: 'Admin only' }); return; }
        const safe = DB.users.map(u => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, created_at: u.created_at }));
        json(res, 200, safe); return;
    }
    
    // ===== VISITORS =====
    if (pathname === '/api/visitors' && method === 'POST') {
        const body = await parseBody(req);
        DB.visitors.push({ id: getNextId(DB.visitors), page: body.page || 'unknown', device: body.device || 'desktop', created_at: new Date().toISOString() });
        saveCollection('visitors');
        json(res, 201, { message: 'Vizit anrejistre!' }); return;
    }
    
    if (pathname === '/api/visitors' && method === 'GET') {
        if (!isAdmin(req)) { json(res, 401, { error: 'Admin only' }); return; }
        const today = new Date().toISOString().split('T')[0];
        const todayVisits = DB.visitors.filter(v => v.created_at && v.created_at.startsWith(today)).length;
        const mobileVisits = DB.visitors.filter(v => v.device === 'mobile').length;
        json(res, 200, { total: DB.visitors.length, today: todayVisits, mobile: mobileVisits, desktop: DB.visitors.length - mobileVisits, recent: DB.visitors.slice(-20).reverse() }); return;
    }
    
    // ===== CONTACTS =====
    if (pathname === '/api/contacts' && method === 'POST') {
        const body = await parseBody(req);
        DB.contacts.unshift({ id: getNextId(DB.contacts), name: body.name || '', email: body.email || '', phone: body.phone || '', message: body.message || '', created_at: new Date().toISOString() });
        saveCollection('contacts');
        json(res, 201, { message: 'Mesaj voye!' }); return;
    }
    
    if (pathname === '/api/contacts' && method === 'GET') { if (!isAdmin(req)) { json(res, 401, { error: 'Admin only' }); return; } json(res, 200, DB.contacts); return; }
    
    // ===== SERVE STATIK =====
    let filePath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
    filePath = path.join(__dirname, '..', filePath);
    serveFile(res, filePath);
});

server.listen(PORT, HOST, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║   🚀 OGSUN SERVER v8.0 - KÒRÈKTE         ║');
    console.log('║   🌐 Port: ' + PORT + '                           ║');
    console.log('║   💾 Storage: JSON + Backup              ║');
    console.log('║   📦 Products: ' + DB.products.length + '                         ║');
    console.log('║   🎫 Promos: ' + DB.promos.length + '                           ║');
    console.log('║   ✅ STATUS: 100% OPERATIONAL            ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log('');
});

