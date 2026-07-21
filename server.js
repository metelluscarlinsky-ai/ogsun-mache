const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

// ===== KONFIGIRASYON =====
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
const DATA_DIR = path.join(__dirname, 'data');
// FIX: dosye ki sèvi fichye statik yo (te gen path traversal anvan)
const STATIC_ROOT = path.join(__dirname, '..');

// ===== ADMIN =====
const ADMIN_EMAIL = 'metelluscarlinsky@gmail.com';
const ADMIN_PASSWORD = 'OGPLUG45';
const ADMIN_TOKEN = crypto.randomBytes(32).toString('hex');

// ===== DATABASE SENP (nan memwa + fichye) =====
let DB = {
    products: [],
    orders: [],
    users: [],
    promos: [],
    contacts: [],
    visitors: []
};

// ===== FONKSYON DATABASE =====
function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
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
                if (Array.isArray(data)) {
                    console.log('✅ Chaje ' + name + ': ' + data.length + ' antre');
                    return data;
                }
            }
        }
    } catch (err) {
        console.log('⚠️ Erè chaje ' + name + ': ' + err.message);
    }
    console.log('📄 ' + name + ': Itilize defo (' + defaultData.length + ' antre)');
    return defaultData;
}

function saveCollection(name) {
    ensureDataDir();
    const filePath = path.join(DATA_DIR, name + '.json');
    const data = DB[name];
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
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
        id: i,
        code: 'OGSUN-PRO' + i,
        affiliate_name: 'Afilye #' + i,
        phone: '',
        natcash: '',
        comm2k: 500,
        comm4k: 1000,
        comm7k: 1500,
        comm9k: 2000,
        active: true,
        orders_count: 0,
        revenue: 0,
        commission: 0
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

// ===== FONKSYON ITILITÈ =====
function serveFile(res, filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const ct = MIME[ext] || 'text/plain';
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h1>404 - Paj pa jwenn</h1>');
            return;
        }
        res.writeHead(200, { 'Content-Type': ct });
        res.end(data);
    });
}

// FIX: sanitize static path pou anpeche "path traversal" (../../etc/passwd)
function safeStaticPath(pathname) {
    let reqPath = pathname === '/' ? 'index.html' : decodeURIComponent(pathname).replace(/^\//, '');
    const resolved = path.normalize(path.join(STATIC_ROOT, reqPath));
    if (!resolved.startsWith(STATIC_ROOT)) {
        return null; // tantativ soti nan dosye a — refize
    }
    return resolved;
}

function parseBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', c => { body += c; });
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

function json(res, code, data) {
    res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data, null, 2));
}

// FIX: kalkile komisyon yon afilye selon valè total kòmand lan (patye 2k/4k/7k/9k)
function computeCommission(promo, total) {
    if (total >= 9000) return promo.comm9k;
    if (total >= 7000) return promo.comm7k;
    if (total >= 4000) return promo.comm4k;
    if (total >= 2000) return promo.comm2k;
    return 0;
}

// ===== SÈVÈ PRENSIPAL =====
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

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    console.log('📡 ' + method + ' ' + pathname);

    try {
        // ===== API INFO =====
        if (pathname === '/api') {
            json(res, 200, {
                name: 'OGSUN API',
                version: '7.1',
                status: 'running',
                products: DB.products.length,
                orders: DB.orders.length,
                users: DB.users.length,
                promos: DB.promos.length,
                visitors: DB.visitors.length,
                admin: ADMIN_EMAIL
            });
            return;
        }

        // ===== ADMIN LOGIN =====
        if (pathname === '/api/admin/login' && method === 'POST') {
            const body = await parseBody(req);
            if (body.email === ADMIN_EMAIL && body.password === ADMIN_PASSWORD) {
                json(res, 200, { success: true, token: ADMIN_TOKEN, message: 'Byenveni Admin!' });
                console.log('🔓 Admin konekte');
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
                totalProducts: DB.products.length,
                totalOrders: DB.orders.length,
                totalRevenue: completed.reduce((s, o) => s + (o.total || 0), 0),
                pendingOrders: DB.orders.filter(o => o.status === 'pending').length,
                totalUsers: DB.users.length,
                totalPromos: DB.promos.filter(p => p.active).length,
                totalVisitors: DB.visitors.length
            });
            return;
        }

        // ===== PRODUCTS =====
        if (pathname === '/api/products' && method === 'GET') {
            json(res, 200, DB.products);
            return;
        }

        const productMatch = pathname.match(/^\/api\/products\/(\d+)$/);

        if (pathname === '/api/products' && method === 'POST') {
            if (!isAdmin(req)) { json(res, 401, { error: 'Admin only' }); return; }
            const body = await parseBody(req);
            if (!body.name || !body.price) { json(res, 400, { error: 'Non ak pri obligatwa!' }); return; }

            const newProduct = {
                id: getNextId(DB.products),
                name: body.name,
                category: body.category || 'Atizana',
                price: parseFloat(body.price) || 0,
                old_price: body.old_price ? parseFloat(body.old_price) : null,
                stock: parseInt(body.stock) || 0,
                badge: body.badge || '',
                description: body.description || '',
                image: body.image || body.image_url || 'logo.png',
                image_url: body.image_url || body.image || 'logo.png'
            };

            DB.products.push(newProduct);
            saveCollection('products');
            console.log('✅ Pwodwi AJOUTE: #' + newProduct.id + ' - ' + newProduct.name);
            json(res, 201, newProduct);
            return;
        }

        if (productMatch) {
            const id = parseInt(productMatch[1]);

            if (method === 'GET') {
                const product = DB.products.find(p => p.id === id);
                json(res, product ? 200 : 404, product || { error: 'Pa jwenn' });
                return;
            }

            if (method === 'PUT') {
                if (!isAdmin(req)) { json(res, 401, { error: 'Admin only' }); return; }
                const body = await parseBody(req);
                const index = DB.products.findIndex(p => p.id === id);
                if (index !== -1) {
                    const current = DB.products[index];
                    // FIX: konvèti tip done kòrèkteman e senkwonize image/image_url tankou nan POST
                    const updated = {
                        ...current,
                        ...body,
                        id,
                        price: body.price !== undefined ? (parseFloat(body.price) || 0) : current.price,
                        old_price: body.old_price !== undefined ? (body.old_price ? parseFloat(body.old_price) : null) : current.old_price,
                        stock: body.stock !== undefined ? (parseInt(body.stock) || 0) : current.stock,
                        image: body.image || body.image_url || current.image,
                        image_url: body.image_url || body.image || current.image_url
                    };
                    DB.products[index] = updated;
                    saveCollection('products');
                    console.log('✏️ Pwodwi MODIFYE: #' + id);
                    json(res, 200, DB.products[index]);
                } else {
                    json(res, 404, { error: 'Pa jwenn' });
                }
                return;
            }

            if (method === 'DELETE') {
                if (!isAdmin(req)) { json(res, 401, { error: 'Admin only' }); return; }
                const before = DB.products.length;
                DB.products = DB.products.filter(p => p.id !== id);
                if (DB.products.length < before) {
                    saveCollection('products');
                    console.log('🗑️ Pwodwi EFASE: #' + id);
                    json(res, 200, { message: 'Efase nèt!' });
                } else {
                    json(res, 404, { error: 'Pa jwenn' });
                }
                return;
            }
        }

        // ===== PROMOS =====
        if (pathname === '/api/promos' && method === 'GET') {
            json(res, 200, DB.promos);
            return;
        }

        if (pathname === '/api/promos/verify' && method === 'POST') {
            const body = await parseBody(req);
            const code = (body.code || '').toUpperCase().trim();

            console.log('🔍 Verifye kòd: ' + code);

            const promo = DB.promos.find(p => p.code.toUpperCase() === code && p.active);

            if (promo) {
                console.log('✅ Afilye jwenn: ' + promo.affiliate_name);
                json(res, 200, promo);
            } else {
                console.log('❌ Kòd pa jwenn: ' + code);
                json(res, 200, { error: 'Kòd pa valab!' });
                // FIX: pa bay lis tout kòd afilye aktif yo nan repons lan — sa te yon fuit enfòmasyon
                // (nenpòt moun te ka jwenn tout kòd promo valab san otantifikasyon)
            }
            return;
        }

        if (pathname === '/api/promos' && method === 'POST') {
            if (!isAdmin(req)) { json(res, 401, { error: 'Admin only' }); return; }
            const body = await parseBody(req);
            const newPromo = {
                id: getNextId(DB.promos),
                code: (body.code || '').toUpperCase(),
                affiliate_name: body.affiliate_name || body.affiliate || '',
                phone: body.phone || '',
                natcash: body.natcash || '',
                comm2k: parseInt(body.comm2k) || 500,
                comm4k: parseInt(body.comm4k) || 1000,
                comm7k: parseInt(body.comm7k) || 1500,
                comm9k: parseInt(body.comm9k) || 2000,
                active: true,
                orders_count: 0,
                revenue: 0,
                commission: 0
            };
            DB.promos.push(newPromo);
            saveCollection('promos');
            console.log('✅ Kòd promo AJOUTE: ' + newPromo.code);
            json(res, 201, newPromo);
            return;
        }

        // FIX: wout ki te manke pou modifye/efase yon promo (admin sèlman)
        const promoMatch = pathname.match(/^\/api\/promos\/(\d+)$/);
        if (promoMatch) {
            const id = parseInt(promoMatch[1]);

            if (method === 'PUT') {
                if (!isAdmin(req)) { json(res, 401, { error: 'Admin only' }); return; }
                const body = await parseBody(req);
                const index = DB.promos.findIndex(p => p.id === id);
                if (index !== -1) {
                    DB.promos[index] = { ...DB.promos[index], ...body, id };
                    saveCollection('promos');
                    console.log('✏️ Promo MODIFYE: #' + id);
                    json(res, 200, DB.promos[index]);
                } else {
                    json(res, 404, { error: 'Pa jwenn' });
                }
                return;
            }

            if (method === 'DELETE') {
                if (!isAdmin(req)) { json(res, 401, { error: 'Admin only' }); return; }
                const before = DB.promos.length;
                DB.promos = DB.promos.filter(p => p.id !== id);
                if (DB.promos.length < before) {
                    saveCollection('promos');
                    console.log('🗑️ Promo EFASE: #' + id);
                    json(res, 200, { message: 'Efase nèt!' });
                } else {
                    json(res, 404, { error: 'Pa jwenn' });
                }
                return;
            }
        }

        // ===== ORDERS =====
        if (pathname === '/api/orders' && method === 'GET') {
            if (!isAdmin(req)) { json(res, 401, { error: 'Admin only' }); return; }
            json(res, 200, DB.orders);
            return;
        }

        if (pathname === '/api/orders' && method === 'POST') {
            const body = await parseBody(req);
            const items = body.items || [];

            if (!Array.isArray(items) || items.length === 0) {
                json(res, 400, { error: 'Panyen an vid!' });
                return;
            }

            // FIX: rekalkile pri a soti nan DB.products (pa fè konfyans ak pri kliyan voye)
            // FIX: verifye stock disponib anvan konfime kòmand
            let total = 0;
            const resolvedItems = [];
            for (const it of items) {
                const product = DB.products.find(p => p.id === it.id || p.id === it.product_id);
                if (!product) {
                    json(res, 400, { error: 'Pwodwi #' + (it.id || it.product_id) + ' pa egziste' });
                    return;
                }
                const qty = parseInt(it.quantity) || 1;
                if (product.stock < qty) {
                    json(res, 400, { error: 'Pa gen ase stock pou "' + product.name + '" (rete: ' + product.stock + ')' });
                    return;
                }
                total += product.price * qty;
                resolvedItems.push({ id: product.id, name: product.name, price: product.price, quantity: qty });
            }

            // FIX: redwi stock chak pwodwi achte
            resolvedItems.forEach(ri => {
                const p = DB.products.find(p => p.id === ri.id);
                if (p) p.stock -= ri.quantity;
            });
            saveCollection('products');

            const order = {
                id: getNextId(DB.orders),
                order_number: 'OGS-' + Date.now().toString().slice(-6),
                customer_name: body.customer_name || '',
                customer_phone: body.customer_phone || '',
                shipping_address: body.shipping_address || '',
                payment_method: body.payment_method || 'natcash',
                promo_code: body.promo_code || '',
                items: resolvedItems,
                total: total,
                status: 'pending',
                created_at: new Date().toISOString()
            };

            // FIX: mete ajou estatistik ak komisyon afilye a si gen yon kòd promo valab
            if (order.promo_code) {
                const promo = DB.promos.find(p => p.code.toUpperCase() === order.promo_code.toUpperCase() && p.active);
                if (promo) {
                    const commission = computeCommission(promo, total);
                    promo.orders_count = (promo.orders_count || 0) + 1;
                    promo.revenue = (promo.revenue || 0) + total;
                    promo.commission = (promo.commission || 0) + commission;
                    saveCollection('promos');
                }
            }

            DB.orders.unshift(order);
            saveCollection('orders');
            console.log('🛒 Kòmand: ' + order.order_number + ' - $' + total);
            json(res, 201, { message: 'Kòmand kreye!', order_number: order.order_number, total: total });
            return;
        }

        const orderMatch = pathname.match(/^\/api\/orders\/(\d+)$/);
        if (orderMatch && method === 'PUT') {
            if (!isAdmin(req)) { json(res, 401, { error: 'Admin only' }); return; }
            const id = parseInt(orderMatch[1]);
            const body = await parseBody(req);
            const order = DB.orders.find(o => o.id === id);
            if (order) {
                order.status = body.status || order.status;
                saveCollection('orders');
                json(res, 200, { message: 'Mete ajou!' });
            } else {
                json(res, 404, { error: 'Pa jwenn' });
            }
            return;
        }

        // ===== USERS =====
        if (pathname === '/api/users/register' && method === 'POST') {
            const body = await parseBody(req);
            if (!body.name || !body.email || !body.password) {
                json(res, 400, { error: 'Non, imèl, ak modpas obligatwa!' });
                return;
            }
            if (DB.users.find(u => u.email === body.email)) {
                json(res, 400, { error: 'Imèl sa a deja itilize!' });
                return;
            }
            const user = {
                id: getNextId(DB.users),
                name: body.name,
                email: body.email,
                password: body.password,
                phone: body.phone || '',
                created_at: new Date().toISOString()
            };
            DB.users.push(user);
            saveCollection('users');
            console.log('👤 Itilizatè: ' + user.name);
            json(res, 201, { success: true, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
            return;
        }

        if (pathname === '/api/users/login' && method === 'POST') {
            const body = await parseBody(req);
            const user = DB.users.find(u => u.email === body.email && u.password === body.password);
            if (user) {
                json(res, 200, { success: true, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
            } else {
                json(res, 401, { success: false, error: 'Imèl oswa modpas pa bon!' });
            }
            return;
        }

        if (pathname === '/api/users' && method === 'GET') {
            if (!isAdmin(req)) { json(res, 401, { error: 'Admin only' }); return; }
            const safe = DB.users.map(u => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, created_at: u.created_at }));
            json(res, 200, safe);
            return;
        }

        // ===== VISITORS =====
        if (pathname === '/api/visitors' && method === 'POST') {
            const body = await parseBody(req);
            DB.visitors.push({
                id: getNextId(DB.visitors),
                page: body.page || 'unknown',
                device: body.device || 'desktop',
                created_at: new Date().toISOString()
            });
            saveCollection('visitors');
            json(res, 201, { message: 'Vizit anrejistre!' });
            return;
        }

        if (pathname === '/api/visitors' && method === 'GET') {
            if (!isAdmin(req)) { json(res, 401, { error: 'Admin only' }); return; }
            const today = new Date().toISOString().split('T')[0];
            const todayVisits = DB.visitors.filter(v => v.created_at && v.created_at.startsWith(today)).length;
            const mobileVisits = DB.visitors.filter(v => v.device === 'mobile').length;

            json(res, 200, {
                total: DB.visitors.length,
                today: todayVisits,
                mobile: mobileVisits,
                desktop: DB.visitors.length - mobileVisits,
                recent: DB.visitors.slice(-20).reverse()
            });
            return;
        }

        // ===== CONTACTS =====
        if (pathname === '/api/contacts' && method === 'POST') {
            const body = await parseBody(req);
            DB.contacts.unshift({
                id: getNextId(DB.contacts),
                name: body.name || '',
                email: body.email || '',
                phone: body.phone || '',
                message: body.message || '',
                created_at: new Date().toISOString()
            });
            saveCollection('contacts');
            json(res, 201, { message: 'Mesaj voye!' });
            return;
        }

        if (pathname === '/api/contacts' && method === 'GET') {
            if (!isAdmin(req)) { json(res, 401, { error: 'Admin only' }); return; }
            json(res, 200, DB.contacts);
            return;
        }

        // FIX: si se yon wout /api/... ki pa egziste, retounen 404 JSON olye tonbe sou fichye statik
        if (pathname.startsWith('/api/')) {
            json(res, 404, { error: 'Wout API sa a pa egziste' });
            return;
        }

        // ===== SÈVÈ FICHYE STATIK =====
        const filePath = safeStaticPath(pathname);
        if (!filePath) {
            res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h1>403 - Aksè refize</h1>');
            return;
        }
        serveFile(res, filePath);

    } catch (err) {
        // FIX: anpeche yon erè inatandi fè sèvè a plante san repons
        console.log('💥 Erè sèvè: ' + err.message);
        if (!res.headersSent) {
            json(res, 500, { error: 'Erè sèvè entèn' });
        }
    }
});

// FIX: pare pou erè ki pa kaptire yo pou sèvè a pa kraze nèt
process.on('uncaughtException', (err) => {
    console.log('💥 Uncaught Exception: ' + err.message);
});
process.on('unhandledRejection', (err) => {
    console.log('💥 Unhandled Rejection: ' + err.message);
});

// ===== KOUMANSE SÈVÈ =====
server.listen(PORT, HOST, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║   🚀 OGSUN SERVER v7.1 ULTRA STABLE      ║');
    console.log('║   🌐 Port: ' + PORT + '                           ║');
    console.log('║   💾 Storage: JSON Files + Memory         ║');
    console.log('║   📦 Products: ' + DB.products.length + '                         ║');
    console.log('║   🎫 Promos: ' + DB.promos.length + '                           ║');
    console.log('║   👤 Users: ' + DB.users.length + '                            ║');
    console.log('║   👑 Admin: ' + ADMIN_EMAIL + '        ║');
    console.log('║   ✅ STATUS: 100% OPERATIONAL             ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log('');
});




