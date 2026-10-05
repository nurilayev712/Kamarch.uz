// Telegram Bot Settings
const TELEGRAM_BOT_TOKEN = '8206958499:AAGH9qbfwz81ReS7XS8OXUqunRnJHcFw0Ps';
const TELEGRAM_CHAT_ID = '5882864189';

let cart = [];
let currentProduct = null;
let currentDiscount = 0; // Discount percentage
let currentTotal = 0; // Total before discount
const DELIVERY_FEE = 20000;
let currentLang = localStorage.getItem('lang') || 'uz';

// DOM Elements
const productList = document.getElementById('product-list');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');

const cartBtn = document.getElementById('cart-btn');
const closeCartBtn = document.getElementById('close-cart');
const cartModal = document.getElementById('cart-modal');
const cartItemsContainer = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total');

const checkoutBtn = document.getElementById('checkout-btn');
const checkoutModal = document.getElementById('checkout-modal');
const closeCheckoutBtn = document.getElementById('close-checkout');
const checkoutForm = document.getElementById('checkout-form');
const submitOrderBtn = document.getElementById('submit-order-btn');
const finalTotalEl = document.getElementById('final-total');

// Promo Code Elements
const promoInput = document.getElementById('promo-code');
const applyPromoBtn = document.getElementById('apply-promo-btn');
const promoMessage = document.getElementById('promo-message');

// Product Modal Elements
const productModal = document.getElementById('product-modal');
const closeProductModal = document.getElementById('close-product-modal');
const modalImg = document.getElementById('modal-img');
const modalTitle = document.getElementById('modal-title');
const modalPrice = document.getElementById('modal-price');
const modalDesc = document.getElementById('modal-desc');
const modalSize = document.getElementById('modal-size');
const modalAddBtn = document.getElementById('modal-add-btn');

const toast = document.getElementById('toast');
const langToggleBtn = document.getElementById('lang-toggle');

let products = []; // Will be fetched from backend

// --- Fetch Products from Backend ---
const fetchProducts = async () => {
    try {
        const response = await fetch('/api/products');
        products = await response.json();
        applyTranslations(); // This applies translations and calls renderProducts
    } catch (error) {
        console.error("Failed to load products:", error);
    }
};

// --- Initialization ---
// Check Dark Mode Preference
if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
    document.getElementById('theme-toggle-icon').classList.replace('fa-moon', 'fa-sun');
}

// Dark Mode Toggle
document.getElementById('theme-toggle').addEventListener('click', () => {
    const icon = document.getElementById('theme-toggle-icon');
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        icon.classList.replace('fa-sun', 'fa-moon');
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        icon.classList.replace('fa-moon', 'fa-sun');
    }
});

// Helper to format currency
const formatPrice = (price) => price.toLocaleString('uz-UZ') + " so'm";

// Show Toast Notification
const showToast = (message) => {
    toast.textContent = message;
    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => toast.classList.add('translate-y-20', 'opacity-0'), 3000);
};

// --- Language Toggle Logic ---
const applyTranslations = () => {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if(translations[currentLang] && translations[currentLang][key]) {
            el.innerHTML = translations[currentLang][key];
        }
    });
    langToggleBtn.textContent = currentLang === 'uz' ? 'RU' : 'UZ';
    document.getElementById('html-tag').setAttribute('lang', currentLang);
    applyFilters(); 
    updateCartUI(); 
};

langToggleBtn.addEventListener('click', () => {
    currentLang = currentLang === 'uz' ? 'ru' : 'uz';
    localStorage.setItem('lang', currentLang);
    applyTranslations();
});

// --- Render Products ---
const renderProducts = (productsToRender = products) => {
    productList.innerHTML = '';
    
    if(productsToRender.length === 0) {
        productList.innerHTML = `<p class="col-span-full text-center text-gray-500 text-xl py-10">Hech narsa topilmadi...</p>`;
        return;
    }

    productsToRender.forEach((product) => {
        const productEl = document.createElement('div');
        productEl.className = 'bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-2xl transition duration-300 transform hover:-translate-y-1 flex flex-col h-full';
        
        const prodName = currentLang === 'uz' ? product.name_uz : product.name_ru;

        productEl.innerHTML = `
            <div class="cursor-pointer overflow-hidden relative" onclick="openProductModal(${product.id})">
                <img src="${product.image}" alt="${prodName}" class="w-full h-64 object-cover transition duration-500 hover:scale-110">
            </div>
            <div class="p-5 flex flex-col flex-grow">
                <h3 class="text-xl font-bold mb-2 text-gray-800 dark:text-white line-clamp-1">${prodName}</h3>
                <div class="flex justify-between items-center mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
                    <span class="text-brown-800 dark:text-brown-400 font-extrabold text-lg">${formatPrice(product.price)}</span>
                    <button onclick="addToCart(${product.id})" class="bg-brown-100 dark:bg-gray-700 text-brown-800 dark:text-white hover:bg-brown-600 hover:text-white dark:hover:bg-brown-600 w-10 h-10 rounded-full flex items-center justify-center transition duration-300">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        `;
        productList.appendChild(productEl);
    });
};

// --- Search and Sort Logic ---
const applyFilters = () => {
    const term = searchInput.value.toLowerCase();
    const sortVal = sortSelect.value;
    
    let filtered = products.filter(p => {
        const name = currentLang === 'uz' ? p.name_uz : p.name_ru;
        return name.toLowerCase().includes(term);
    });
    
    if(sortVal === 'price-asc') {
        filtered.sort((a, b) => a.price - b.price);
    } else if(sortVal === 'price-desc') {
        filtered.sort((a, b) => b.price - a.price);
    }
    
    renderProducts(filtered);
};

searchInput.addEventListener('input', applyFilters);
sortSelect.addEventListener('change', applyFilters);

// --- Product Modal Logic ---
window.openProductModal = (productId) => {
    currentProduct = products.find(p => p.id === productId);
    modalImg.src = currentProduct.image;
    modalTitle.textContent = currentLang === 'uz' ? currentProduct.name_uz : currentProduct.name_ru;
    modalPrice.textContent = formatPrice(currentProduct.price);
    modalDesc.textContent = currentLang === 'uz' ? currentProduct.desc_uz : currentProduct.desc_ru;
    productModal.classList.remove('hidden');
};

closeProductModal.addEventListener('click', () => productModal.classList.add('hidden'));

modalAddBtn.addEventListener('click', () => {
    addToCart(currentProduct.id, modalSize.value);
    productModal.classList.add('hidden');
});

// --- Cart Logic ---
window.addToCart = (productId, size = 'Standart') => {
    const product = products.find(p => p.id === productId);
    const cartItemId = `${productId}-${size}`;
    const existingItem = cart.find(item => item.cartId === cartItemId);

    if (existingItem) existingItem.quantity += 1;
    else cart.push({ ...product, cartId: cartItemId, selectedSize: size, quantity: 1 });
    
    updateCartUI();
    const prodName = currentLang === 'uz' ? product.name_uz : product.name_ru;
    showToast(`${prodName} savatga qo'shildi!`);
};

window.removeFromCart = (cartId) => {
    cart = cart.filter(item => item.cartId !== cartId);
    updateCartUI();
};

window.updateQuantity = (cartId, change) => {
    const item = cart.find(i => i.cartId === cartId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) removeFromCart(cartId);
        else updateCartUI();
    }
};

const updateCartUI = () => {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    cartCount.classList.toggle('hidden', totalItems === 0);
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
        const emptyText = translations[currentLang]?.cartEmpty || "Savatingiz bo'sh";
        cartItemsContainer.innerHTML = `<div class="text-center text-gray-500 mt-10"><i class="fas fa-shopping-cart text-4xl mb-4 text-gray-300"></i><p>${emptyText}</p></div>`;
        cartTotal.textContent = "0 so'm";
        checkoutBtn.disabled = true;
        checkoutBtn.classList.add('opacity-50', 'cursor-not-allowed');
        return;
    }

    checkoutBtn.disabled = false;
    checkoutBtn.classList.remove('opacity-50', 'cursor-not-allowed');

    currentTotal = 0;
    cart.forEach(item => {
        currentTotal += item.price * item.quantity;
        const itemEl = document.createElement('div');
        itemEl.className = 'flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-4';
        const itemName = currentLang === 'uz' ? item.name_uz : item.name_ru;
        
        itemEl.innerHTML = `
            <div class="flex items-center w-2/3">
                <img src="${item.image}" alt="${itemName}" class="w-16 h-16 object-cover rounded mr-3">
                <div>
                    <h4 class="font-bold text-sm line-clamp-1">${itemName}</h4>
                    <p class="text-gray-500 text-xs">${item.selectedSize}</p>
                    <p class="text-brown-600 dark:text-brown-400 font-bold text-xs">${formatPrice(item.price)}</p>
                </div>
            </div>
            <div class="flex items-center space-x-2 w-1/3 justify-end">
                <button onclick="updateQuantity('${item.cartId}', -1)" class="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 w-6 h-6 rounded flex items-center justify-center">-</button>
                <span class="text-sm font-bold w-4 text-center">${item.quantity}</span>
                <button onclick="updateQuantity('${item.cartId}', 1)" class="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 w-6 h-6 rounded flex items-center justify-center">+</button>
                <button onclick="removeFromCart('${item.cartId}')" class="text-red-400 hover:text-red-600 ml-2"><i class="fas fa-trash"></i></button>
            </div>
        `;
        cartItemsContainer.appendChild(itemEl);
    });

    cartTotal.textContent = formatPrice(currentTotal);
    updateFinalTotal();
};

// --- Promo Code Logic ---
const updateFinalTotal = () => {
    let finalSum = currentTotal;
    if (currentDiscount > 0) {
        finalSum = currentTotal - (currentTotal * currentDiscount / 100);
        finalTotalEl.innerHTML = `<span class="line-through text-gray-400 text-sm mr-2">${formatPrice(currentTotal)}</span> ${formatPrice(finalSum + DELIVERY_FEE)}`;
    } else {
        finalTotalEl.textContent = formatPrice(currentTotal + DELIVERY_FEE);
    }
};

applyPromoBtn.addEventListener('click', () => {
    const code = promoInput.value.trim().toUpperCase();
    if (code === 'KAMAR2026') {
        currentDiscount = 10;
        promoMessage.textContent = currentLang === 'uz' ? "10% chegirma qo'llanildi! 🎉" : "Скидка 10% применена! 🎉";
        promoMessage.className = "text-xs mt-1 font-bold text-green-500";
    } else {
        currentDiscount = 0;
        promoMessage.textContent = currentLang === 'uz' ? "Kod noto'g'ri yoki muddati o'tgan." : "Код недействителен.";
        promoMessage.className = "text-xs mt-1 font-bold text-red-500";
    }
    updateFinalTotal();
});

// Modals
cartBtn.addEventListener('click', () => cartModal.classList.remove('hidden'));
closeCartBtn.addEventListener('click', () => cartModal.classList.add('hidden'));

checkoutBtn.addEventListener('click', () => {
    if(cart.length > 0) {
        cartModal.classList.add('hidden');
        checkoutModal.classList.remove('hidden');
        updateFinalTotal();
    }
});

closeCheckoutBtn.addEventListener('click', () => checkoutModal.classList.add('hidden'));

window.addEventListener('click', (e) => {
    if(e.target === cartModal) cartModal.classList.add('hidden');
    if(e.target === checkoutModal) checkoutModal.classList.add('hidden');
    if(e.target === productModal) productModal.classList.add('hidden');
});

// --- Telegram Integration ---
const sendToTelegram = async (message, phone) => {
    const url = \`https://api.telegram.org/bot\${TELEGRAM_BOT_TOKEN}/sendMessage\`;
    const inlineKeyboard = {
        inline_keyboard: [[{ text: "📞 Mijozga qo'ng'iroq qilish", url: \`tel:\${phone.replace(/[^0-9+]/g, '')}\` }]]
    };
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message, parse_mode: 'HTML', reply_markup: inlineKeyboard })
    });
    return response.json();
};

checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitOrderBtn.disabled = true;
    submitOrderBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>...';
    
    const name = document.getElementById('cust-name').value;
    const phone = document.getElementById('cust-phone').value;
    const address = document.getElementById('cust-address').value;
    const comment = document.getElementById('cust-comment').value || "Yo'q";
    
    // Get Payment Method
    const paymentMethodEl = document.querySelector('input[name="payment_method"]:checked');
    const paymentMethodText = paymentMethodEl && paymentMethodEl.value === 'card' ? '💳 Plastik karta orqali (Click/Payme)' : '💵 Naqd pul';
    
    const orderId = Math.floor(1000 + Math.random() * 9000);
    const time = new Date().toLocaleString('uz-UZ');
    
    let orderText = \`<b>📦 BUYURTMA #\${orderId}</b>\n\`;
    orderText += \`🕒 Vaqt: \${time}\n\n\`;
    orderText += \`👤 Mijoz: \${name}\n\`;
    orderText += \`📞 Telefon: \${phone}\n\`;
    orderText += \`📍 Manzil: \${address}\n\`;
    orderText += \`💬 Izoh: \${comment}\n\`;
    orderText += \`💳 To'lov turi: <b>\${paymentMethodText}</b>\n\n\`;
    orderText += \`<b>🛒 Maxsulotlar:</b>\n\`;
    
    cart.forEach((item, index) => {
        const itemName = item.name_uz; // Admin har doim o'zbekcha ko'radi
        orderText += \`\${index+1}. \${itemName} (\${item.selectedSize}) - \${item.quantity} ta x \${formatPrice(item.price)}\n\`;
    });
    
    orderText += \`\n<b>💵 Mahsulotlar summasi:</b> \${formatPrice(currentTotal)}\n\`;
    orderText += \`🚚 Yetkazib berish: \${formatPrice(DELIVERY_FEE)}\n\`;
    
    let finalSum = currentTotal;
    if (currentDiscount > 0) {
        orderText += \`<b>🎁 Chegirma:</b> \${currentDiscount}% (Promo-kod)\n\`;
        finalSum = currentTotal - (currentTotal * currentDiscount / 100);
    }
    
    finalSum += DELIVERY_FEE;
    orderText += \`\n<b>✅ YAKUNIY SUMMA: \${formatPrice(finalSum)}</b>\`;
    
    try {
        const res = await sendToTelegram(orderText, phone);
        if(res.ok) {
            // Orqa fonga (Backend'ga) saqlash
            fetch('/api/orders', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ name, phone, address, items: cart, total: finalSum, payment: paymentMethodText })
            }).catch(e => console.log("DB save error", e));

            showToast(currentLang === 'uz' ? "Buyurtmangiz qabul qilindi!" : "Ваш заказ принят!");
            if (paymentMethodEl && paymentMethodEl.value === 'card') {
                alert(currentLang === 'uz' ? "Iltimos, kartaga pulni o'tkazing: 8600 1234 5678 9012 (Ism Familiya)" : "Пожалуйста, переведите деньги на карту: 8600 1234 5678 9012 (Имя Фамилия)");
            }
            cart = [];
            currentDiscount = 0;
            promoInput.value = '';
            promoMessage.textContent = '';
            updateCartUI();
            checkoutModal.classList.add('hidden');
            checkoutForm.reset();
        } else {
            alert("Xatolik yuz berdi. Iltimos keyinroq urinib ko'ring.");
        }
    } catch (error) {
        alert("Internetga ulanishda xatolik.");
    } finally {
        submitOrderBtn.disabled = false;
        submitOrderBtn.innerHTML = translations[currentLang]?.submitOrder || 'Tasdiqlash';
    }
});

// Initialize
fetchProducts();
