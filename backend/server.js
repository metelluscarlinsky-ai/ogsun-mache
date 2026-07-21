const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// ===== FICHYE DONE =====
const PRODUCTS_FILE = path.join(__dirname, 'products.json');
const ORDERS_FILE = path.join(__dirname, 'orders.json');
const USERS_FILE = path.join(__dirname, 'users.json');
const CONTACTS_FILE = path.join(__dirname, 'contacts.json');
const SUPPLIERS_FILE = path.join(__dirname, 'suppliers.json');
const TRANSACTIONS_FILE = path.join(__dirname, 'transactions.json');

// ===== FONKSYON DONE SOLID =====
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
    return defaultData.slice();
}

function saveData(filePath, data) {
    try {
        // Asire dosye a egziste
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log('💾 Sove ' + data.length + ' antre nan ' + path.basename(filePath));
        return true;
    } catch (err) {
        console.log('❌ Erè sove ' + path.basename(filePath) + ': ' + err.message);
        return false;
    }
}

// ===== ADMIN KONFIGIRASYON =====
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'metelluscarlinsky@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'OGPLUG45';
const ADMIN_TOKEN = crypto.randomBytes(32).toString('hex');

// ===== DONE INISYAL =====
const defaultProducts = [
    { id: 1, name: 'Sak Pay Deluxe', category: 'Atizana', price: 45, old_price: 65, stock: 50, rating: 4.8, reviews: 128, badge: 'Nouvo', description: 'Sak pay atizanal fèt ak men.', image: 'logo.png', image_url: 'logo.png', source: 'manual' },
    { id: 2, name: 'Chemiz Brode', category: 'Rad', price: 35, old_price: 50, stock: 100, rating: 4.7, reviews: 95, badge: 'Popilè', description: 'Chemiz koton ak broderi.', image: 'logo.png', image_url: 'logo.png', source: 'manual' },
    { id: 3, name: 'Tablo Dekoratif', category: 'Dekorasyon', price: 75, old_price: 95, stock: 25, rating: 4.9, reviews: 72, badge: '', description: 'Tablo pentire ak men.', image: 'logo.png', image_url: 'logo.png', source: 'manual' },
    { id: 4, name: 'Siwo Myèl Natirèl', category: 'Manje', price: 15, stock: 200, rating: 4.6, reviews: 200, badge: 'Eko', description: 'Siwo myèl natirèl Ayiti.', image: 'logo.png', image_url: 'logo.png', source: 'manual' },
];

// ===== CHAJE DONE =====
let products = loadData(PRODUCTS_FILE, defaultProducts);
let orders = loadData(ORDERS_FILE, []);
let users = loadData(USERS_FILE, []);
let contacts = loadData(CONTACTS_FILE, []);
let suppliers = loadData(SUPPLIERS_FILE, []);
let transactions = loadData(TRANSACTIONS_FILE, []);

// ===== KONTE ID =====
let productIdCounter = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 9;
let orderCounter = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1;
let userIdCounter = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
let supplierIdCounter = suppliers.length > 0 ? Math.max(...suppliers.map(s => s.id)) + 1 : 1;
let transactionIdCounter = transactions.length > 0 ? Math.max(...transactions.map(t => t.id)) + 1 : 1;

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
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
};

// ===== FONKSYON ITILITÈ =====
function serveFile(res, filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'text/plain';
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            // Si fichye pa jwenn, eseye index.html
            if (filePath.endsWith('.html')) {
                const indexPath = path.join(path.dirname(filePath), 'index.html');
                fs.readFile(indexPath, (err2, data2) => {
                    if (err2) {
                        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                        res.end('<h1>404 - Paj pa jwenn</h1>');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                        res.end(data2);
                    }
                });
            } else {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>404 - Paj pa jwenn</h1>');
            }
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
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    const myUrl = url.parse(req.url, true);
    const pathname = myUrl.pathname;
    
    console.log('📡 ' + req.method + ' ' + pathname);
    
    // ===== API INFO =====
    if (pathname === '/api') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            name: 'OGSUN API',
            version: '4.0',
            status: 'running',
            products: products.length,
            orders: orders.length,
            users: users.length,
            storage: 'JSON Files'
        }));
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
    
    // ===== ADMIN VERIFY =====
    if (pathname === '/api/admin/verify' && req.method === 'GET') {
        res.writeHead(checkAdmin(req) ? 200 : 401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(checkAdmin(req) ? { valid: true, email: ADMIN_EMAIL } : { valid: false }));
        return;
    }
    
    // ===== PRODUCTS (GET ALL) =====
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
    
    // ===== PRODUCT (CREATE) =====
    if (pathname === '/api/products' && req.method === 'POST') {
        if (!checkAdmin(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Admin only' }));
            return;
        }
        
        const body = await getBody(req);
        
        if (!body.name || !body.price) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Non ak pri obligatwa!' }));
            return;
        }
        
        const newP = {
            id: productIdCounter++,
            name: body.name,
            category: body.category || 'Atizana',
            price: parseFloat(body.price) || 0,
            old_price: body.old_price ? parseFloat(body.old_price) : null,
            stock: parseInt(body.stock) || 0,
            rating: 0,
            reviews: 0,
            badge: body.badge || '',
            description: body.description || '',
            image: body.image || body.image_url || 'logo.png',
            image_url: body.image_url || body.image || 'logo.png',
            source: body.source || 'manual',
            supplier_id: body.supplier_id || null,
            cj_url: body.cj_url || '',
            supplier_price: body.supplier_price ? parseFloat(body.supplier_price) : null
        };
        
        products.push(newP);
        const saved = saveData(PRODUCTS_FILE, products);
        
        console.log('✅ Pwodwi kreye: #' + newP.id + ' - ' + newP.name + ' | Sove: ' + (saved ? 'WI' : 'NON'));
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newP));
        return;
    }
    
    // ===== PRODUCT (UPDATE) =====
    if (productMatch && req.method === 'PUT') {
        if (!checkAdmin(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Admin only' }));
            return;
        }
        
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
    
    // ===== PRODUCT (DELETE) =====
    if (productMatch && req.method === 'DELETE') {
        if (!checkAdmin(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Admin only' }));
            return;
        }
        
        const id = parseInt(productMatch[1]);
        const productName = products.find(p => p.id === id)?.name || 'Unknown';
        
        products = products.filter(p => p.id !== id);
        const saved = saveData(PRODUCTS_FILE, products);
        
        console.log('🗑️ Pwodwi efase: #' + id + ' - ' + productName + ' | Sove: ' + (saved ? 'WI' : 'NON'));
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Efase!', product: productName }));
        return;
    }
    
    // ===== ADMIN STATS =====
    if (pathname === '/api/admin/stats') {
        if (!checkAdmin(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Admin only' }));
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
            conversionRate: orders.length ? ((completed.length / orders.length) * 100).toFixed(1) : 0,
            totalUsers: users.length,
            totalSuppliers: suppliers.length
        }));
        return;
    }
    
    // ===== ORDERS =====
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
            payment_method: body.payment_method || 'natcash',
            promo_code: body.promo_code || '',
            total: total,
            status: 'pending',
            created_at: new Date().toISOString()
        };
        
        orders.unshift(order);
        saveData(ORDERS_FILE, orders);
        
        console.log('🛒 Nouvo kòmand: ' + order.order_number + ' - $' + total);
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Kòmand kreye!', order_number: order.order_number, total: total }));
        return;
    }
    
    if (pathname === '/api/orders' && req.method === 'GET') {
        if (!checkAdmin(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Admin only' }));
            return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(orders));
        return;
    }
    
    const orderMatch = pathname.match(/^\/api\/orders\/(\d+)$/);
    if (orderMatch && req.method === 'PUT') {
        if (!checkAdmin(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Admin only' }));
            return;
        }
        
        const id = parseInt(orderMatch[1]);
        const body = await getBody(req);
        const order = orders.find(o => o.id === id);
        
        if (order) {
            order.status = body.status || order.status;
            saveData(ORDERS_FILE, orders);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Mete ajou!' }));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not found' }));
        }
        return;
    }
    
    // ===== USERS =====
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
            created_at: new Date().toISOString()
        };
        
        users.push(user);
        saveData(USERS_FILE, users);
        
        console.log('👤 Nouvo itilizatè: ' + user.name);
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, user: { id: user.id, name: user.name, email: user.email } }));
        return;
    }
    
    if (pathname === '/api/users/login' && req.method === 'POST') {
        const body = await getBody(req);
        const user = users.find(u => u.email === body.email && u.password === body.password);
        
        if (user) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } }));
        } else {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Imèl oswa modpas pa bon!' }));
        }
        return;
    }
    
    if (pathname === '/api/users' && req.method === 'GET') {
        if (!checkAdmin(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Admin only' }));
            return;
        }
        
        const safeUsers = users.map(u => ({
            id: u.id, name: u.name, email: u.email,
            phone: u.phone, created_at: u.created_at
        }));
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(safeUsers));
        return;
    }
    
    const userMatch = pathname.match(/^\/api\/users\/(\d+)$/);
    if (userMatch && req.method === 'DELETE') {
        if (!checkAdmin(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Admin only' }));
            return;
        }
        
        const id = parseInt(userMatch[1]);
        users = users.filter(u => u.id !== id);
        saveData(USERS_FILE, users);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Efase!' }));
        return;
    }
    
    // ===== CONTACTS =====
    if (pathname === '/api/contacts' && req.method === 'POST') {
        const body = await getBody(req);
        contacts.unshift({
            id: contacts.length + 1,
            ...body,
            created_at: new Date().toISOString()
        });
        saveData(CONTACTS_FILE, contacts);
        
        console.log('📧 Nouvo mesaj: ' + (body.name || 'Anonim'));
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Mesaj voye!' }));
        return;
    }
    
    if (pathname === '/api/contacts' && req.method === 'GET') {
        if (!checkAdmin(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Admin only' }));
            return;
        }
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
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║   🚀 OGSUN SERVER v4.0 SOLID             ║');
    console.log('║   🌐 Port: ' + PORT + '                           ║');
    console.log('║   💾 Storage: JSON Files                 ║');
    console.log('║   📦 Products: ' + products.length + '                         ║');
    console.log('║   👑 Admin: ' + ADMIN_EMAIL + '        ║');
    console.log('║   ✅ SAVE: ON (Pwodwi rete nèt)          ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log('');
});

