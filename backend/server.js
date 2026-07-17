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
const TRANSACTIONS_FILE = path.join(__dirname, 'transactions.json');

// ===== FONKSYON DONE =====
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

// ===== KONFIGIRASYON =====
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'metelluscarlinsky@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'OGPLUG45';
const ADMIN_TOKEN = crypto.randomBytes(32).toString('hex');

// Peman konfigirasyon
const PAYPAL_EMAIL = 'metelluscarlinsky@gmail.com';
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || 'VOTRE_PAYPAL_CLIENT_ID';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'VOTRE_STRIPE_SECRET_KEY';
const NATCASH_NUMBER = '32924776';
const WHATSAPP_NUMBER = '32924776';

// ===== DONE INISYAL =====
const defaultProducts = [
    { id: 1, name: 'Sak Pay Deluxe', category: 'Atizana', price: 45, old_price: 65, stock: 50, badge: 'Nouvo', description: 'Sak pay atizanal fèt ak men.', image: 'logo.png', image_url: 'logo.png', source: 'manual', cj_url: '', supplier_price: null },
    { id: 2, name: 'Chemiz Brode', category: 'Rad', price: 35, old_price: 50, stock: 100, badge: 'Popilè', description: 'Chemiz koton ak broderi.', image: 'logo.png', image_url: 'logo.png', source: 'manual', cj_url: '', supplier_price: null },
    { id: 3, name: 'Tablo Dekoratif', category: 'Dekorasyon', price: 75, old_price: 95, stock: 25, badge: '', description: 'Tablo pentire ak men.', image: 'logo.png', image_url: 'logo.png', source: 'manual', cj_url: '', supplier_price: null },
    { id: 4, name: 'Siwo Myèl Natirèl', category: 'Manje', price: 15, stock: 200, badge: 'Eko', description: 'Siwo myèl natirèl Ayiti.', image: 'logo.png', image_url: 'logo.png', source: 'manual', cj_url: '', supplier_price: null },
];

let products = loadData(PRODUCTS_FILE, defaultProducts);
let orders = loadData(ORDERS_FILE, []);
let users = loadData(USERS_FILE, []);
let contacts = loadData(CONTACTS_FILE, []);
let transactions = loadData(TRANSACTIONS_FILE, []);

let productIdCounter = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 9;
let orderCounter = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1;
let userIdCounter = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
let transactionIdCounter = transactions.length > 0 ? Math.max(...transactions.map(t => t.id)) + 1 : 1;

// ===== MIME TYPES =====
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
        res.end(JSON.stringify({ name: 'OGSUN API', status: 'running', products: products.length, orders: orders.length, features: ['CJ Dropshipping', 'PayPal', 'Stripe', 'NatCash', 'WhatsApp'] }));
        return;
    }
    
    // ===== ADMIN LOGIN =====
    if (pathname === '/api/admin/login' && req.method === 'POST') {
        const body = await getBody(req);
        if (body.email === ADMIN_EMAIL && body.password === ADMIN_PASSWORD) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, token: ADMIN_TOKEN, message: 'Byenveni Admin!' }));
        } else {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Imèl oswa kòd pa bon!' }));
        }
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
            image_url: body.image_url || body.image || 'logo.png',
            // Chan CJ Dropshipping
            source: body.source || 'manual',
            cj_url: body.cj_url || '',
            supplier_price: body.supplier_price ? parseFloat(body.supplier_price) : null,
            profit: body.supplier_price ? (parseFloat(body.price) - parseFloat(body.supplier_price)) : null
        };
        products.push(newP);
        saveData(PRODUCTS_FILE, products);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newP));
        return;
    }
    
    // ===== PRODUCT (UPDATE) =====
    if (productMatch && req.method === 'PUT') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        const id = parseInt(productMatch[1]);
        const body = await getBody(req);
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            products[index] = { ...products[index], ...body, id };
            // Kalkile pwofi si gen supplier_price
            if (body.supplier_price) {
                products[index].profit = (products[index].price || 0) - parseFloat(body.supplier_price);
            }
            saveData(PRODUCTS_FILE, products);
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
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        const id = parseInt(productMatch[1]);
        products = products.filter(p => p.id !== id);
        saveData(PRODUCTS_FILE, products);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Efase!' }));
        return;
    }
    
    // ===== ADMIN STATS =====
    if (pathname === '/api/admin/stats') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        const completed = orders.filter(o => o.status === 'completed');
        const cjProducts = products.filter(p => p.source === 'cj_dropshipping');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            totalProducts: products.length,
            cjProducts: cjProducts.length,
            totalOrders: orders.length,
            totalRevenue: completed.reduce((s, o) => s + o.total, 0),
            pendingOrders: orders.filter(o => o.status === 'pending').length,
            totalTransactions: transactions.length
        }));
        return;
    }
    
    // ===== ORDERS (CREATE - AK PEMAN) =====
    if (pathname === '/api/orders' && req.method === 'POST') {
        const body = await getBody(req);
        const items = body.items || [];
        const total = items.reduce((s, i) => s + (i.price * i.quantity), 0);
        const paymentMethod = body.payment_method || 'whatsapp';
        
        const order = {
            id: orderCounter++,
            order_number: 'OGS-' + Date.now().toString().slice(-6),
            customer_name: body.customer_name || '',
            customer_email: body.customer_email || '',
            customer_phone: body.customer_phone || '',
            shipping_address: body.shipping_address || '',
            payment_method: paymentMethod,
            total, status: 'pending',
            created_at: new Date().toISOString()
        };
        orders.unshift(order);
        saveData(ORDERS_FILE, orders);
        
        // Anrejistre tranzaksyon
        const transaction = {
            id: transactionIdCounter++,
            order_number: order.order_number,
            amount: total,
            method: paymentMethod,
            status: 'pending',
            created_at: new Date().toISOString()
        };
        transactions.unshift(transaction);
        saveData(TRANSACTIONS_FILE, transactions);
        
        // Repons selon metòd peman
        let paymentInstructions = '';
        if (paymentMethod === 'natcash') {
            paymentInstructions = `Voye $${total} sou NatCash: ${NATCASH_NUMBER}`;
        } else if (paymentMethod === 'paypal') {
            paymentInstructions = `Peye sou PayPal: ${PAYPAL_EMAIL}`;
        } else if (paymentMethod === 'stripe') {
            paymentInstructions = `Peman pa kat kredi konfime!`;
        } else {
            paymentInstructions = `Kontakte sou WhatsApp: ${WHATSAPP_NUMBER}`;
        }
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            message: 'Kòmand kreye!', 
            order_number: order.order_number, 
            total,
            payment_instructions: paymentInstructions
        }));
        return;
    }
    
    // ===== ORDERS (GET ALL - ADMIN) =====
    if (pathname === '/api/orders' && req.method === 'GET') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(orders));
        return;
    }
    
    // ===== ORDER (UPDATE STATUS) =====
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
    
    // ===== CJ DROPSHIPPING - SEARCH (SIMILE) =====
    if (pathname === '/api/cj/search' && req.method === 'POST') {
        const body = await getBody(req);
        const keyword = (body.keyword || '').toLowerCase();
        
        // Pwodwi CJ simule (ranplase ak vrè API CJ si w gen API Key)
        const cjProducts = [
            { id: 'cj-001', name: 'Sak Pay Atizanal', price: 12.50, shipping: 5.00, stock: 500, image: 'logo.png', cj_url: 'https://cjdropshipping.com/product/sak-pay' },
            { id: 'cj-002', name: 'Chemiz Brode Koton', price: 8.00, shipping: 3.50, stock: 1000, image: 'logo.png', cj_url: 'https://cjdropshipping.com/product/chemiz-brode' },
            { id: 'cj-003', name: 'Tablo Dekoratif', price: 22.00, shipping: 8.00, stock: 200, image: 'logo.png', cj_url: 'https://cjdropshipping.com/product/tablo' },
            { id: 'cj-004', name: 'Siwo Myèl Natirèl', price: 5.00, shipping: 2.00, stock: 800, image: 'logo.png', cj_url: 'https://cjdropshipping.com/product/siwo' },
            { id: 'cj-005', name: 'Boutèy Plastik Resikle', price: 10.00, shipping: 4.00, stock: 300, image: 'logo.png', cj_url: 'https://cjdropshipping.com/product/boutey' },
        ];
        
        const filtered = keyword ? cjProducts.filter(p => p.name.toLowerCase().includes(keyword)) : cjProducts;
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ products: filtered, total: filtered.length }));
        return;
    }
    
    // ===== CJ DROPSHIPPING - IMPORT =====
    if (pathname === '/api/cj/import' && req.method === 'POST') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        const body = await getBody(req);
        const newP = {
            id: productIdCounter++,
            name: body.name || 'Pwodwi CJ',
            category: body.category || 'CJ Dropshipping',
            price: parseFloat(body.price) || 0,
            stock: parseInt(body.stock) || 999,
            badge: 'CJ',
            description: body.description || 'Pwodwi enpòte depi CJ Dropshipping.',
            image: body.image || 'logo.png',
            image_url: body.image || 'logo.png',
            source: 'cj_dropshipping',
            cj_url: body.cj_url || '',
            supplier_price: parseFloat(body.supplier_price) || parseFloat(body.price) || 0,
            profit: (parseFloat(body.price) || 0) - (parseFloat(body.supplier_price) || parseFloat(body.price) || 0)
        };
        products.push(newP);
        saveData(PRODUCTS_FILE, products);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, product: newP }));
        return;
    }
    
    // ===== PEMAN PAYPAL (SIMILE) =====
    if (pathname === '/api/payment/paypal' && req.method === 'POST') {
        const body = await getBody(req);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: true, 
            message: 'Peman PayPal konfime!',
            paypal_email: PAYPAL_EMAIL,
            amount: body.amount,
            instructions: `Voye $${body.amount} sou PayPal: ${PAYPAL_EMAIL}`
        }));
        return;
    }
    
    // ===== PEMAN STRIPE (SIMILE) =====
    if (pathname === '/api/payment/stripe' && req.method === 'POST') {
        const body = await getBody(req);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: true, 
            message: 'Peman Stripe konfime!',
            amount: body.amount,
            instructions: `Peman $${body.amount} pa kat kredi reyisi!`
        }));
        return;
    }
    
    // ===== TRANSACTIONS (GET ALL - ADMIN) =====
    if (pathname === '/api/transactions' && req.method === 'GET') {
        if (!checkAdmin(req)) { res.writeHead(401); res.end(JSON.stringify({error:'Admin only'})); return; }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(transactions));
        return;
    }
    
    // ===== USERS =====
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
    
    if (pathname === '/api/users/login' && req.method === 'POST') {
        const body = await getBody(req);
        const user = users.find(u => u.email === body.email && u.password === body.password);
        res.writeHead(user ? 200 : 401, { 'Content-Type': 'application/json' });
        res.end(user ? JSON.stringify({ success: true, user: { id: user.id, name: user.name, email: user.email } }) : JSON.stringify({ success: false, error: 'Imèl/modpas pa bon!' }));
        return;
    }
    
    // ===== CONTACTS =====
    if (pathname === '/api/contacts' && req.method === 'POST') {
        const body = await getBody(req);
        contacts.unshift({ id: contacts.length + 1, ...body, created_at: new Date().toISOString() });
        saveData(CONTACTS_FILE, contacts);
        res.writeHead(201, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ message: 'Mesaj voye!' }));
        return;
    }
    
    // ===== SERVE FICHYE STATIK =====
    let filePath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
    filePath = path.join(__dirname, '..', filePath);
    serveFile(res, filePath);
});

server.listen(PORT, HOST, () => {
    console.log('🚀 OGSUN SERVER AK CJ + PEMAN REYÈL AP MACHE!');
    console.log('📦 Pwodwi: ' + products.length);
    console.log('💳 Peman: PayPal, Stripe, NatCash, WhatsApp');
    console.log('🏭 CJ Dropshipping: Aktif');
});

