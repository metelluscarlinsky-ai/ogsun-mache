#!/usr/bin/env python3
# ============================================
# OGSUN BOT v5.0 - KONEKSYON OTOMATIK
# Konekte ak imel/kod si token pa mache
# ============================================

import requests
import json
import time
import os
import sys
from datetime import datetime
from colorama import init, Fore, Style

init(autoreset=True)

# ===== KONFIGIRASYON =====
CONFIG_FILE = "sites_config.json"
PRODUCTS_FILE = "bot_products.json"
LOG_FILE = "ogsun_bot.log"
BACKUP_DIR = "backups"

DEFAULT_SITES = {
    "ogsun": {
        "url": "https://ogsun-mache-lakay-blqd.onrender.com",
        "api": "https://ogsun-mache-lakay-blqd.onrender.com/api",
        "admin_token": "",
        "admin_email": "metelluscarlinsky@gmail.com",
        "admin_password": "OGPLUG45",
        "active": True,
        "name": "OGSUN Mache Lakay",
        "last_check": None,
        "status": "healthy"
    }
}

DEFAULT_PRODUCTS = [
    {"name": "Sak Pay Deluxe", "category": "Atizana", "price": 45, "old_price": 65, "stock": 50, "badge": "Nouvo", "description": "Sak pay atizanal fet ak men.", "image": "logo.png", "image_url": "logo.png"},
    {"name": "Chemiz Brode", "category": "Rad", "price": 35, "old_price": 50, "stock": 100, "badge": "Popile", "description": "Chemiz koton ak broderi.", "image": "logo.png", "image_url": "logo.png"},
    {"name": "Tablo Dekoratif", "category": "Dekorasyon", "price": 75, "old_price": 95, "stock": 25, "badge": "", "description": "Tablo pentire ak men.", "image": "logo.png", "image_url": "logo.png"},
    {"name": "Siwo Myel Natirel", "category": "Manje", "price": 15, "stock": 200, "badge": "Eko", "description": "Siwo myel natirel Ayiti.", "image": "logo.png", "image_url": "logo.png"},
    {"name": "Boutey Resikle", "category": "Pwodwi Natirel", "price": 25, "old_price": 35, "stock": 75, "badge": "Eko", "description": "Boutey plastik resikle.", "image": "logo.png", "image_url": "logo.png"},
    {"name": "Panyen Atizanal", "category": "Atizana", "price": 55, "old_price": 70, "stock": 30, "badge": "", "description": "Panyen atizanal fet ak men.", "image": "logo.png", "image_url": "logo.png"},
    {"name": "Mayo Koton", "category": "Rad", "price": 20, "stock": 150, "badge": "", "description": "Mayo koton 100% natirel.", "image": "logo.png", "image_url": "logo.png"},
    {"name": "Kad Foto Dekore", "category": "Dekorasyon", "price": 30, "old_price": 40, "stock": 40, "badge": "Nouvo", "description": "Kad foto dekore ak men.", "image": "logo.png", "image_url": "logo.png"},
]

# ===== FONKSYON ITILITE =====

def log_message(message):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(LOG_FILE, 'a') as f:
        f.write(f"[{timestamp}] {message}\n")
    print(Fore.CYAN + f"[LOG] {message}")

def load_json(filename, default):
    try:
        if os.path.exists(filename):
            with open(filename, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data if data else default
    except:
        pass
    return default.copy() if isinstance(default, dict) else default[:]

def save_json(filename, data):
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def print_banner():
    print(Fore.YELLOW + Style.BRIGHT + """
╔══════════════════════════════════════════════╗
║                                              ║
║   OGSUN BOT v5.0 - KONEKSYON OTOMATIK       ║
║   Jesyon Sit - Pwodwi - Sekirite             ║
║   (c) 2026 OGSUN AI                          ║
║                                              ║
╚══════════════════════════════════════════════╝
""")

# ===== FONKSYON KONEKSYON OTOMATIK =====

def get_admin_token(site_config):
    """Jwenn token admin otomatikman - eseye token anvan, apre imel/kod"""
    
    # Si deja gen yon token ki pa defo, eseye l
    if site_config.get('admin_token') and site_config['admin_token'] not in ['TOKEN_WA_ISIT', '']:
        print(Fore.CYAN + "  Teste token ki nan fichye a...")
        # Verifye si token an mache
        try:
            test = requests.get(
                f"{site_config['api']}/admin/verify",
                headers={'Authorization': f"Bearer {site_config['admin_token']}"},
                timeout=5
            )
            if test.status_code == 200:
                print(Fore.GREEN + "  Token valab!")
                return site_config['admin_token']
        except:
            pass
    
    # Sinon, konekte ak imel/kod
    try:
        print(Fore.CYAN + "  Konekte ak imel/kod...")
        email = site_config.get('admin_email', 'metelluscarlinsky@gmail.com')
        password = site_config.get('admin_password', 'OGPLUG45')
        
        response = requests.post(
            f"{site_config['api']}/admin/login",
            json={"email": email, "password": password},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('token', '')
            if token:
                print(Fore.GREEN + f"  Token jwenn! ({token[:20]}...)")
                return token
        else:
            print(Fore.RED + f"  Login echwe: Status {response.status_code}")
    except Exception as e:
        print(Fore.RED + f"  Pa ka konekte: {str(e)[:40]}")
    
    print(Fore.RED + "  Pa ka jwenn token! Verifye imel/kod ou.")
    return None

# ===== MENI PWODWI =====

def show_products():
    products = load_json(PRODUCTS_FILE, DEFAULT_PRODUCTS)
    print(Fore.CYAN + "\n" + "="*70)
    print(Fore.CYAN + "  PWODWI BOT LA")
    print(Fore.CYAN + "="*70)
    
    if not products:
        print(Fore.YELLOW + "  Pa gen pwodwi. Ajoute ak opsyon 2.")
        return products
    
    for i, p in enumerate(products, 1):
        badge_str = f"[{p.get('badge')}]" if p.get('badge') else ""
        old_str = f" | Ansyen: ${p['old_price']}" if p.get('old_price') else ""
        img_str = p.get('image', 'logo.png')
        print(Fore.WHITE + f"  [{i}] {p['name']} {badge_str}")
        print(Fore.CYAN + f"      Kat: {p.get('category','-')} | Pri: ${p['price']}{old_str} | Stock: {p.get('stock',0)}")
        print(Fore.CYAN + f"      Imaj: {img_str[:60]}")
        print()
    
    return products

def add_product_menu():
    products = load_json(PRODUCTS_FILE, DEFAULT_PRODUCTS)
    
    print(Fore.CYAN + "\n" + "="*50)
    print(Fore.CYAN + "  AJOUTE NOUVO PWODWI")
    print(Fore.CYAN + "="*50)
    
    name = input(Fore.YELLOW + "\n  Non pwodwi *: ").strip()
    if not name:
        print(Fore.RED + "  Non obligatwa!")
        return
    
    category = input(Fore.YELLOW + "  Kategori (Atizana/Rad/Dekorasyon/Manje): ").strip()
    
    try:
        price = float(input(Fore.YELLOW + "  Pri ($) *: ").strip())
    except:
        print(Fore.RED + "  Pri obligatwa!")
        return
    
    old_price_input = input(Fore.YELLOW + "  Ansyen pri ($) [Enter si pa gen]: ").strip()
    old_price = float(old_price_input) if old_price_input else None
    
    try:
        stock = int(input(Fore.YELLOW + "  Stock [0]: ").strip() or "0")
    except:
        stock = 0
    
    print(Fore.YELLOW + "  Badge: Nouvo, Popile, Eko")
    badge = input(Fore.YELLOW + "  Badge [Enter si pa gen]: ").strip()
    
    description = input(Fore.YELLOW + "  Deskripsyon: ").strip()
    
    print(Fore.YELLOW + "\n  FOTO PWODWI")
    print(Fore.CYAN + "  Kole URL imaj (ex: https://i.imgur.com/xxxx.jpg)")
    image = input(Fore.YELLOW + "  URL Imaj [Enter pou logo.png]: ").strip()
    
    new_product = {
        "name": name,
        "category": category if category else "Atizana",
        "price": price,
        "old_price": old_price,
        "stock": stock,
        "badge": badge if badge else "",
        "description": description if description else f"{name} - pwodwi atizanal ayisyen.",
        "image": image if image else "logo.png",
        "image_url": image if image else "logo.png"
    }
    
    products.append(new_product)
    save_json(PRODUCTS_FILE, products)
    
    print(Fore.GREEN + f"\n  '{name}' AJOUTE!")
    log_message(f"Pwodwi ajoute: {name}")

def edit_product_menu():
    products = load_json(PRODUCTS_FILE, DEFAULT_PRODUCTS)
    
    if not products:
        print(Fore.YELLOW + "\n  Pa gen pwodwi pou modifye.")
        return
    
    print(Fore.CYAN + "\n" + "="*50)
    print(Fore.CYAN + "  MODIFYE PWODWI")
    print(Fore.CYAN + "="*50)
    
    show_products()
    
    try:
        idx = int(input(Fore.YELLOW + "\n  Nimewo pwodwi: ").strip()) - 1
        
        if 0 <= idx < len(products):
            p = products[idx]
            print(Fore.CYAN + f"\n  MODIFYE: {p['name']}")
            print(Fore.CYAN + "  (Peze Enter pou kenbe valè aktyel la)\n")
            
            name = input(Fore.YELLOW + f"  Non [{p['name']}]: ").strip()
            category = input(Fore.YELLOW + f"  Kategori [{p.get('category','')}]: ").strip()
            price = input(Fore.YELLOW + f"  Pri [{p['price']}]: ").strip()
            old_price = input(Fore.YELLOW + f"  Ansyen pri [{p.get('old_price','')}]: ").strip()
            stock = input(Fore.YELLOW + f"  Stock [{p.get('stock',0)}]: ").strip()
            badge = input(Fore.YELLOW + f"  Badge [{p.get('badge','')}]: ").strip()
            description = input(Fore.YELLOW + f"  Deskripsyon [{p.get('description','')[:40]}...]: ").strip()
            image = input(Fore.YELLOW + f"  URL Imaj [{p.get('image','logo.png')[:50]}]: ").strip()
            
            if name: p['name'] = name
            if category: p['category'] = category
            if price: p['price'] = float(price)
            if old_price: p['old_price'] = float(old_price) if old_price else None
            if stock: p['stock'] = int(stock)
            if badge: p['badge'] = badge
            if description: p['description'] = description
            if image: p['image'] = image; p['image_url'] = image
            
            save_json(PRODUCTS_FILE, products)
            print(Fore.GREEN + f"\n  '{p['name']}' MODIFYE!")
            log_message(f"Pwodwi modifye: {p['name']}")
        else:
            print(Fore.RED + "  Nimewo pa valab!")
    except ValueError:
        print(Fore.RED + "  Antre yon nimewo valab!")

def delete_product_menu():
    products = load_json(PRODUCTS_FILE, DEFAULT_PRODUCTS)
    
    if not products:
        print(Fore.YELLOW + "\n  Pa gen pwodwi pou efase.")
        return
    
    print(Fore.CYAN + "\n" + "="*50)
    print(Fore.CYAN + "  EFASE PWODWI")
    print(Fore.CYAN + "="*50)
    
    show_products()
    
    try:
        idx = int(input(Fore.YELLOW + "\n  Nimewo pwodwi: ").strip()) - 1
        
        if 0 <= idx < len(products):
            name = products[idx]['name']
            confirm = input(Fore.RED + f"  Efase '{name}'? (wi/non): ").strip().lower()
            
            if confirm in ['wi', 'w', 'yes', 'y']:
                del products[idx]
                save_json(PRODUCTS_FILE, products)
                print(Fore.GREEN + f"\n  '{name}' EFASE!")
                log_message(f"Pwodwi efase: {name}")
            else:
                print(Fore.YELLOW + "  Anile.")
        else:
            print(Fore.RED + "  Nimewo pa valab!")
    except ValueError:
        print(Fore.RED + "  Antre yon nimewo valab!")

# ===== FONKSYON SIT =====

def add_site_menu():
    print(Fore.CYAN + "\n" + "="*50)
    print(Fore.CYAN + "  AJOUTE NOUVO SIT")
    print(Fore.CYAN + "="*50)
    
    name = input(Fore.YELLOW + "\n  Non kout: ").strip().lower()
    display_name = input(Fore.YELLOW + "  Non afichaj: ").strip()
    url = input(Fore.YELLOW + "  URL: ").strip()
    api = input(Fore.YELLOW + "  URL API: ").strip()
    email = input(Fore.YELLOW + "  Imel admin: ").strip()
    password = input(Fore.YELLOW + "  Kod admin: ").strip()
    
    sites = load_json(CONFIG_FILE, DEFAULT_SITES)
    sites[name] = {
        "url": url, "api": api,
        "admin_token": "",
        "admin_email": email or "admin@example.com",
        "admin_password": password or "password",
        "active": True, "name": display_name,
        "last_check": None, "status": "unknown"
    }
    save_json(CONFIG_FILE, sites)
    print(Fore.GREEN + f"\n  Sit '{display_name}' AJOUTE!")

def select_site():
    sites = load_json(CONFIG_FILE, DEFAULT_SITES)
    active = {k: v for k, v in sites.items() if v.get('active')}
    
    if not active:
        print(Fore.YELLOW + "\n  Pa gen sit aktif!")
        return None
    
    print(Fore.CYAN + "\n  SIT DISPONIB:")
    for name, config in active.items():
        print(Fore.WHITE + f"  [{name}] {config['name']} ({config['url']})")
    
    name = input(Fore.YELLOW + "\n  Chwazi sit la: ").strip().lower()
    
    if name in active:
        return name, active[name]
    else:
        print(Fore.RED + "  Sit pa jwenn!")
        return None

# ===== FONKSYON API =====

def add_products_to_site(site_config):
    products = load_json(PRODUCTS_FILE, DEFAULT_PRODUCTS)
    
    print(Fore.CYAN + f"\n  VOYE PWODWI SOU: {site_config['name']}")
    print(Fore.CYAN + "  " + "="*50)
    
    if not products:
        print(Fore.YELLOW + "  Pa gen pwodwi!")
        return 0
    
    # Jwenn token otomatikman
    token = get_admin_token(site_config)
    if not token:
        print(Fore.RED + "  Pa ka konekte! Verifye imel/kod.")
        return 0
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f"Bearer {token}"
    }
    
    # Tcheke pwodwi ki deja egziste
    try:
        existing = requests.get(f"{site_config['api']}/products", timeout=10).json()
        existing_names = [p['name'] for p in existing]
        print(Fore.CYAN + f"  {len(existing)} pwodwi deja sou sit la")
    except:
        existing_names = []
    
    added = 0
    skipped = 0
    
    for i, product in enumerate(products, 1):
        if product['name'] in existing_names:
            print(Fore.YELLOW + f"  [{i}/{len(products)}] {product['name']} - Deja egziste (sote)")
            skipped += 1
            continue
        
        try:
            print(Fore.CYAN + f"  [{i}/{len(products)}] {product['name']}...", end=' ')
            response = requests.post(
                f"{site_config['api']}/products",
                headers=headers,
                json=product,
                timeout=10
            )
            if response.status_code == 201:
                print(Fore.GREEN + "AJOUTE!")
                added += 1
                existing_names.append(product['name'])
            else:
                print(Fore.YELLOW + f"Status: {response.status_code}")
        except Exception as e:
            print(Fore.RED + f"{str(e)[:30]}")
        
        time.sleep(1)
    
    print(Fore.CYAN + f"\n  REZIME: {added} ajoute | {skipped} sote | {added+skipped}/{len(products)}")
    log_message(f"Pwodwi voye: {added} nouvo")
    return added

def check_site_health(site_config):
    print(Fore.CYAN + f"\n  TCHEKE SANTE: {site_config['name']}")
    print(Fore.CYAN + "  " + "-"*40)
    
    tests = 0
    
    try:
        r = requests.get(site_config['api'], timeout=10)
        if r.status_code == 200:
            print(Fore.GREEN + "  [OK] API mache")
            tests += 1
        else:
            print(Fore.RED + f"  [X] API: Status {r.status_code}")
    except:
        print(Fore.RED + "  [X] API pa aksesib")
    
    try:
        r = requests.get(f"{site_config['api']}/products", timeout=10)
        print(Fore.GREEN + f"  [OK] {len(r.json())} pwodwi sou sit la")
        tests += 1
    except:
        print(Fore.RED + "  [X] Pa ka jwenn pwodwi")
    
    try:
        r = requests.get(site_config['url'], timeout=10)
        print(Fore.GREEN + "  [OK] Sit aksesib") if r.status_code == 200 else print(Fore.YELLOW + f"  [!] Sit: Status {r.status_code}")
        tests += 1
    except:
        print(Fore.YELLOW + "  [!] Sit domi")
    
    print(Fore.CYAN + f"\n  {tests}/3 tes pase")

def backup_site_data(site_config):
    try:
        if not os.path.exists(BACKUP_DIR):
            os.makedirs(BACKUP_DIR)
        r = requests.get(f"{site_config['api']}/products", timeout=10)
        if r.status_code == 200:
            filename = f"{BACKUP_DIR}/{site_config['name'].replace(' ','_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(filename, 'w') as f:
                json.dump(r.json(), f, indent=2)
            print(Fore.GREEN + f"  Backup: {filename}")
            return True
    except:
        pass
    return False

def auto_run():
    print(Fore.YELLOW + f"\nKOURI OTOMATIK - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)
    
    sites = load_json(CONFIG_FILE, DEFAULT_SITES)
    
    for name, config in sites.items():
        if config.get('active'):
            print(Fore.CYAN + f"\n{config['name']}")
            check_site_health(config)
            add_products_to_site(config)
            backup_site_data(config)
    
    log_message("Auto-run konple")
    print(Fore.GREEN + "\nOtomatik fini!")

# ===== MENI PRENSIPAL =====

def show_main_menu():
    print(Fore.YELLOW + Style.BRIGHT + """
╔══════════════════════════════════════════════╗
║           MENI PRENSIPAL v5.0               ║
╠══════════════════════════════════════════════╣
║  PWODWI (modifye lis lokal)                  ║
║  1.  Lis pwodwi                              ║
║  2.  Ajoute pwodwi (meni entèraktif)         ║
║  3.  Modifye pwodwi (meni entèraktif)        ║
║  4.  Efase pwodwi                            ║
║                                              ║
║  SIT (jesyon sit yo)                         ║
║  5.  Voye pwodwi sou sit la                  ║
║  6.  Tcheke sante sit                        ║
║  7.  Backup done sit                         ║
║  8.  Ajoute yon nouvo sit                    ║
║  9.  Lis tout sit yo                         ║
║                                              ║
║  OTOMATIK                                    ║
║  10. Kouri otomatik (voye sou tout sit)      ║
║  11. Kouri chak 24h (kontinyèl)              ║
║                                              ║
║  0.  Soti                                    ║
╚══════════════════════════════════════════════╝
""")

def main():
    print_banner()
    
    if not os.path.exists(PRODUCTS_FILE):
        save_json(PRODUCTS_FILE, DEFAULT_PRODUCTS)
    if not os.path.exists(CONFIG_FILE):
        save_json(CONFIG_FILE, DEFAULT_SITES)
    
    while True:
        show_main_menu()
        choice = input(Fore.WHITE + "Chwazi opsyon (0-11): ").strip()
        
        if choice == '1': show_products()
        elif choice == '2': add_product_menu()
        elif choice == '3': edit_product_menu()
        elif choice == '4': delete_product_menu()
        elif choice == '5':
            result = select_site()
            if result: add_products_to_site(result[1])
        elif choice == '6':
            result = select_site()
            if result: check_site_health(result[1])
        elif choice == '7':
            result = select_site()
            if result: backup_site_data(result[1])
        elif choice == '8': add_site_menu()
        elif choice == '9':
            sites = load_json(CONFIG_FILE, DEFAULT_SITES)
            print(Fore.CYAN + "\n  TOUT SIT YO:")
            for name, config in sites.items():
                print(Fore.WHITE + f"  [{name}] {config['name']} | {config['url']}")
        elif choice == '10': auto_run()
        elif choice == '11':
            print(Fore.YELLOW + "\n  Bot ap kouri chak 24h... (Ctrl+C pou sispann)")
            try:
                while True:
                    auto_run()
                    time.sleep(86400)
            except KeyboardInterrupt:
                print(Fore.GREEN + "\n  Bot sispann.")
        elif choice == '0':
            print(Fore.GREEN + "\n  Orevwa!")
            sys.exit(0)
        else:
            print(Fore.RED + "  Opsyon pa valab!")
        
        input(Fore.YELLOW + "\nPeze Enter pou kontinye...")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(Fore.GREEN + "\n\nOrevwa! Bot sispann.")
        sys.exit(0)
