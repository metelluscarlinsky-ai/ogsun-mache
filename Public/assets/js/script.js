/* ============================================
   OGSUN LUXURY SCRIPT - VÈSYON FINAL
   Tout bouton mache sou tout paj
   ============================================ */

// ===================================
// KONSOLE DEMARAJ
// ===================================
console.log('🔥🔥🔥 OGSUN Script v3.0 Loaded!');
console.log('📍 Page: ' + window.location.pathname);
console.log('⏰ ' + new Date().toLocaleString());

// ===================================
// FONKSYON NAVIGASYON PRENSIPAL
// ===================================
function navigateTo(page) {
    console.log('🚀 Navigasyon => ' + page);
    
    // Netwaye non paj la
    page = page.replace('./', '').replace('/', '');
    
    // Verifye si paj la ekziste
    fetch(page, { method: 'HEAD' })
        .then(function(response) {
            if (response.ok) {
                console.log('✅ Paj ekziste! Ale...');
                window.location.href = page;
            } else {
                console.log('❌ Paj pa ekziste!');
                alert('❌ Paj ' + page + ' pa jwenn!\n\nTcheke si fichye a nan menm dosye.');
            }
        })
        .catch(function(error) {
            console.log('⚠️ Pa ka verifye, eseye ale kanmenm...');
            window.location.href = page;
        });
}

// ===================================
// KONEKTE TOUT BOUTON LÈ PAJ LA CHAJE
// ===================================
document.addEventListener('DOMContentLoaded', function() {
    
    console.log('📄 DOM chaje! Koneksyon bouton...');
    
    // ===================================
    // 1. BOUTON ACHTE KOUNYA (CTA)
    // ===================================
    var ctaPrimary = document.querySelector('.cta-primary');
    if (ctaPrimary) {
        ctaPrimary.addEventListener('click', function(e) {
            e.preventDefault();
            navigateTo('shop.html');
        });
        console.log('✅ CTA Primary konekte');
    }
    
    // ===================================
    // 2. BOUTON SOU NOU (CTA)
    // ===================================
    var ctaSecondary = document.querySelector('.cta-secondary');
    if (ctaSecondary) {
        ctaSecondary.addEventListener('click', function(e) {
            e.preventDefault();
            navigateTo('about.html');
        });
        console.log('✅ CTA Secondary konekte');
    }
    
    // ===================================
    // 3. BOUTON KONEKTE
    // ===================================
    var primaryBtn = document.querySelector('.primary-btn');
    if (primaryBtn) {
        primaryBtn.addEventListener('click', function(e) {
            e.preventDefault();
            navigateTo('account.html');
        });
        console.log('✅ Bouton Konekte konekte');
    }
    
    // ===================================
    // 4. BOUTON PANYE
    // ===================================
    var cartBtn = document.querySelector('.cart-btn');
    if (cartBtn) {
        cartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            navigateTo('cart.html');
        });
        console.log('✅ Bouton Panye konekte');
    }
    
    // ===================================
    // 5. BOUTON RECHÈCH
    // ===================================
    var searchBtn = document.querySelector('.search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', function(e) {
            e.preventDefault();
            navigateTo('shop.html');
        });
        console.log('✅ Bouton Rechèch konekte');
    }
    
    // ===================================
    // 6. TOUT LYEN NAVBAR
    // ===================================
    var navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
            var href = this.getAttribute('href');
            if (href && href.indexOf('.html') > -1 && href.indexOf('#') === -1) {
                e.preventDefault();
                navigateTo(href);
            }
        });
    });
    console.log('✅ ' + navLinks.length + ' lyen navbar konekte');
    
    // ===================================
    // 7. TOUT LYEN FOOTER
    // ===================================
    var footerLinks = document.querySelectorAll('.footer-links a, .footer-bottom a');
    footerLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
            var href = this.getAttribute('href');
            if (href && href.indexOf('.html') > -1 && href.indexOf('#') === -1) {
                e.preventDefault();
                navigateTo(href);
            }
        });
    });
    console.log('✅ ' + footerLinks.length + ' lyen footer konekte');
    
    // ===================================
    // 8. BOUTON VIEW ALL
    // ===================================
    var viewAllBtn = document.querySelector('.view-all-btn');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', function(e) {
            e.preventDefault();
            navigateTo('shop.html');
        });
        console.log('✅ Bouton View All konekte');
    }
    
    // ===================================
    // 9. BOUTON AJOUTE NAN PANYE
    // ===================================
    var addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
    addToCartBtns.forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            alert('✅ Pwodwi ajoute nan panye!');
            navigateTo('cart.html');
        });
    });
    console.log('✅ ' + addToCartBtns.length + ' bouton ajoute panye konekte');
    
    // ===================================
    // 10. BOUTON QUICK VIEW
    // ===================================
    var quickViewBtns = document.querySelectorAll('.quick-view-btn');
    quickViewBtns.forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            navigateTo('product.html');
        });
    });
    console.log('✅ ' + quickViewBtns.length + ' bouton quick view konekte');
    
    // ===================================
    // 11. BOUTON WISHLIST
    // ===================================
    var wishlistBtns = document.querySelectorAll('.wishlist-btn');
    wishlistBtns.forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (btn.textContent.trim() === '❤️') {
                btn.textContent = '💔';
            } else {
                btn.textContent = '❤️';
            }
            alert('🏷️ Wishlist mete ajou!');
        });
    });
    console.log('✅ ' + wishlistBtns.length + ' bouton wishlist konekte');
    
    // ===================================
    // 12. KAT PWODWI (KLIKE SOU KAT LA)
    // ===================================
    var productCards = document.querySelectorAll('.product-card');
    productCards.forEach(function(card) {
        card.addEventListener('click', function(e) {
            if (!e.target.closest('button')) {
                var link = this.getAttribute('data-link') || 'product.html';
                navigateTo(link);
            }
        });
    });
    console.log('✅ ' + productCards.length + ' kat pwodwi konekte');
    
    // ===================================
    // 13. MOBILE MENU
    // ===================================
    var mobileBtn = document.querySelector('.mobile-menu-btn');
    if (mobileBtn) {
        mobileBtn.addEventListener('click', function() {
            var nav = document.querySelector('.nav-links');
            if (nav) {
                nav.classList.toggle('active');
            }
        });
        console.log('✅ Mobile menu konekte');
    }
    
    // ===================================
    // 14. THEME TOGGLE
    // ===================================
    var themeBtn = document.querySelector('.theme-btn');
    if (themeBtn) {
        themeBtn.addEventListener('click', function() {
            var html = document.documentElement;
            var current = html.getAttribute('data-theme');
            var newTheme = current === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('ogsun-theme', newTheme);
            console.log('🌓 Theme: ' + newTheme);
        });
        console.log('✅ Theme toggle konekte');
    }
    
    // ===================================
    // 15. COUNTER ANIMATION
    // ===================================
    var counters = document.querySelectorAll('.stat-number[data-count]');
    if (counters.length > 0) {
        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    var counter = entry.target;
                    var target = parseInt(counter.getAttribute('data-count'));
                    var current = 0;
                    var increment = target / 50;
                    
                    function update() {
                        current += increment;
                        if (current < target) {
                            counter.textContent = Math.floor(current).toLocaleString();
                            requestAnimationFrame(update);
                        } else {
                            counter.textContent = target.toLocaleString();
                        }
                    }
                    update();
                    observer.unobserve(counter);
                }
            });
        }, { threshold: 0.5 });
        
        counters.forEach(function(counter) {
            observer.observe(counter);
        });
        console.log('✅ Counter animation konekte');
    }
    
    // ===================================
    // 16. NAVBAR SCROLL EFFECT
    // ===================================
    window.addEventListener('scroll', function() {
        var navbar = document.querySelector('.navbar');
        if (navbar) {
            if (window.pageYOffset > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    });
    console.log('✅ Navbar scroll konekte');
    
    // ===================================
    // 17. BOUTON CHECKOUT
    // ===================================
    var checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            navigateTo('checkout.html');
        });
        console.log('✅ Bouton Checkout konekte');
    }
    
    // ===================================
    // 18. BOUTON ADMIN AK STYLE
    // ===================================
    var shopLink = document.querySelector('.shop-link');
    if (shopLink) {
        shopLink.addEventListener('click', function(e) {
            e.preventDefault();
            navigateTo('shop.html');
        });
        console.log('✅ Shop link konekte');
    }
    
    // ===================================
    // 19. FAQ ACCORDION
    // ===================================
    var faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var answer = this.nextElementSibling;
            var icon = this.querySelector('.faq-icon');
            
            if (answer.style.display === 'block') {
                answer.style.display = 'none';
                if (icon) icon.textContent = '▼';
            } else {
                answer.style.display = 'block';
                if (icon) icon.textContent = '▲';
            }
        });
    });
    console.log('✅ FAQ accordion konekte');
    
    // ===================================
    // 20. KONTAK FÒM
    // ===================================
    var contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('✅ Mesaj voye avèk siksè! Nou pral reponn ou byento!');
            this.reset();
        });
        console.log('✅ Contact form konekte');
    }
    
    // ===================================
    // 21. APPLY FILTERS
    // ===================================
    var applyFiltersBtn = document.querySelector('.apply-filters-btn');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', function() {
            alert('🔍 Filtè aplikè!');
        });
        console.log('✅ Apply filters konekte');
    }
    
    // ===================================
    // 22. RESET FILTERS
    // ===================================
    var resetFiltersBtn = document.querySelector('.reset-filters-btn');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', function() {
            alert('🔄 Filtè reyajiste!');
        });
        console.log('✅ Reset filters konekte');
    }
    
    // ===================================
    // 23. PAGINATION
    // ===================================
    var pageBtns = document.querySelectorAll('.page-btn');
    pageBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            pageBtns.forEach(function(b) {
                b.classList.remove('active');
            });
            this.classList.add('active');
        });
    });
    console.log('✅ Pagination konekte');
    
    // ===================================
    // 24. ACCOUNT TABS
    // ===================================
    var accountNavItems = document.querySelectorAll('.account-nav-item');
    accountNavItems.forEach(function(item) {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            accountNavItems.forEach(function(nav) {
                nav.classList.remove('active');
                nav.style.color = '#a0a0a0';
                nav.style.background = 'transparent';
            });
            
            this.classList.add('active');
            this.style.color = '#d4af37';
            this.style.background = 'rgba(212,175,55,0.1)';
            
            var tabId = this.getAttribute('data-tab') + '-tab';
            var tabs = document.querySelectorAll('.tab-content');
            tabs.forEach(function(tab) {
                tab.style.display = 'none';
            });
            
            var activeTab = document.getElementById(tabId);
            if (activeTab) activeTab.style.display = 'block';
        });
    });
    console.log('✅ Account tabs konekte');
    
    // ===================================
    // 25. PAYMENT METHOD TOGGLE
    // ===================================
    var paymentOptions = document.querySelectorAll('input[name="payment"]');
    paymentOptions.forEach(function(option) {
        option.addEventListener('change', function() {
            var allLabels = document.querySelectorAll('.payment-option');
            allLabels.forEach(function(label) {
                label.style.border = '2px solid rgba(255,255,255,0.08)';
            });
            
            var selectedLabel = this.closest('.payment-option');
            if (selectedLabel) {
                selectedLabel.style.border = '2px solid #d4af37';
            }
            
            var cardDetails = document.getElementById('card-details');
            var moncashDetails = document.getElementById('moncash-details');
            
            if (cardDetails && moncashDetails) {
                if (this.value === 'card') {
                    cardDetails.style.display = 'grid';
                    moncashDetails.style.display = 'none';
                } else if (this.value === 'moncash') {
                    cardDetails.style.display = 'none';
                    moncashDetails.style.display = 'grid';
                } else {
                    cardDetails.style.display = 'none';
                    moncashDetails.style.display = 'none';
                }
            }
        });
    });
    console.log('✅ Payment toggle konekte');
    
    // ===================================
    // 26. QTY BUTTONS
    // ===================================
    var qtyBtns = document.querySelectorAll('.qty-btn');
    qtyBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var input = this.parentElement.querySelector('input');
            if (!input) return;
            var value = parseInt(input.value);
            if (this.textContent.trim() === '+') {
                value = Math.min(value + 1, 10);
            } else {
                value = Math.max(value - 1, 1);
            }
            input.value = value;
        });
    });
    console.log('✅ Qty buttons konekte');
    
    // ===================================
    // 27. ORDER FILTERS
    // ===================================
    var orderFilters = document.querySelectorAll('.order-filter');
    orderFilters.forEach(function(btn) {
        btn.addEventListener('click', function() {
            orderFilters.forEach(function(b) {
                b.style.background = 'transparent';
                b.style.color = '#a0a0a0';
                b.style.border = '1px solid rgba(255,255,255,0.2)';
            });
            this.style.background = '#d4af37';
            this.style.color = '#0a0a0a';
            this.style.border = 'none';
        });
    });
    console.log('✅ Order filters konekte');
    
    // ===================================
    // 28. NEWSLETTER FORM
    // ===================================
    var newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var emailInput = this.querySelector('input[type="email"]') || this.querySelector('input[type="text"]');
            var email = emailInput ? emailInput.value : '';
            if (email && email.indexOf('@') > -1) {
                alert('✅ Enskripsyon reyisi! Mèsi!');
                this.reset();
            } else {
                alert('❌ Tanpri antre yon imèl valab');
            }
        });
        console.log('✅ Newsletter form konekte');
    }
    
    // ===================================
    // 29. PLACE ORDER (Checkout)
    // ===================================
    var placeOrderBtn = document.querySelector('.place-order-btn');
    if (!placeOrderBtn) {
        // Tcheke si gen yon bouton ki sanble
        var allButtons = document.querySelectorAll('button');
        allButtons.forEach(function(btn) {
            if (btn.textContent.indexOf('Konfime Kòmand') > -1 || 
                btn.textContent.indexOf('Place Order') > -1) {
                btn.addEventListener('click', function() {
                    alert('✅ Kòmand konfime! Mèsi pou acha w! 🎉');
                    setTimeout(function() {
                        navigateTo('orders.html');
                    }, 1500);
                });
                console.log('✅ Place Order konekte');
            }
        });
    }
    
    // ===================================
    // 30. BACK TO TOP SMOOTH
    // ===================================
    var backToTopLinks = document.querySelectorAll('a[href="#"]');
    backToTopLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
            var href = this.getAttribute('href');
            if (href === '#') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });
    
    // ===================================
    // FINAL - TOUT BOUTON KONEKTE
    // ===================================
    console.log('✅✅✅ TOUT BOUTON KONEKTE AK SIKÈS! ✅✅✅');
    console.log('📊 Total bouton verifye: 30+');
    console.log('💡 Pou verifye: klike sou nenpòt bouton - li dwe mache!');
    
}); // END DOMContentLoaded


// ===================================
// FONKSYON GLOBAL - DISPONIB PARTOU
// ===================================

// Fonksyon showToast (notifikasyon)
function showToast(message) {
    var toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = 'position:fixed; bottom:20px; right:20px; background:linear-gradient(135deg,#d4af37,#f4d03f); color:#0a0a0a; padding:15px 25px; border-radius:30px; font-weight:bold; z-index:9999; box-shadow:0 10px 30px rgba(212,175,55,0.4); animation:slideIn 0.3s ease;';
    document.body.appendChild(toast);
    setTimeout(function() {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(function() {
            toast.remove();
        }, 300);
    }, 3000);
}

// Fonksyon applyCoupon (checkout)
function applyCoupon() {
    var couponInput = document.querySelector('input[placeholder*="kòd"]') || 
                      document.querySelector('input[placeholder*="Kòd"]');
    var messageEl = document.getElementById('coupon-message');
    var code = couponInput ? couponInput.value.trim().toUpperCase() : '';
    
    if (code === 'OGSUN10') {
        alert('✅ Kòd OGSUN10 aplike! Ou gen 10% rabè!');
        if (messageEl) {
            messageEl.innerHTML = '✅ Kòd aplike! -10% rabè!';
            messageEl.style.color = '#4caf50';
        }
    } else if (code === '') {
        alert('❌ Antre yon kòd');
    } else {
        alert('❌ Kòd pa valab');
    }
}

// Fonksyon placeOrder (checkout)
function placeOrder() {
    var selectedPayment = document.querySelector('input[name="payment"]:checked');
    var method = selectedPayment ? selectedPayment.value : 'card';
    
    var paymentNames = {
        'card': 'Kat Kredi/Debi',
        'moncash': 'MonCash',
        'bank': 'Transfè Bankè',
        'cod': 'Peye a Livrezon'
    };
    
    if (confirm('✅ Konfime kòmand $90.00 USD?\nMetòd: ' + (paymentNames[method] || method))) {
        alert('🎉 Kòmand konfime! Mèsi pou acha w!');
        window.location.href = 'orders.html';
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        // Fèmen tout modal
        var modals = document.querySelectorAll('.cart-modal, .quick-view-modal, .login-modal');
        modals.forEach(function(modal) {
            modal.remove();
        });
    }
    
    // Ctrl+K pou rechèch
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        var searchInput = document.querySelector('.search-box input');
        if (searchInput) {
            searchInput.focus();
        } else {
            window.location.href = 'shop.html';
        }
    }
});
