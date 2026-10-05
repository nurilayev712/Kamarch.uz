const showTab = (tabId) => {
    document.getElementById('orders-tab').classList.add('hidden');
    document.getElementById('products-tab').classList.add('hidden');
    document.getElementById(`${tabId}-tab`).classList.remove('hidden');
    if(tabId === 'orders') fetchOrders();
    if(tabId === 'products') fetchProducts();
};

const fetchOrders = async () => {
    try {
        const res = await fetch('/api/orders');
        const orders = await res.json();
        const tbody = document.getElementById('orders-list');
        tbody.innerHTML = '';
        if(orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4">Hozircha buyurtmalar yo\'q</td></tr>';
            return;
        }
        orders.reverse().forEach(order => {
            const tr = document.createElement('tr');
            tr.className = 'border-b';
            tr.innerHTML = `
                <td class="p-3">#${order.id}</td>
                <td class="p-3">${order.date}</td>
                <td class="p-3 font-bold">${order.name}</td>
                <td class="p-3"><a href="tel:${order.phone}" class="text-blue-500">${order.phone}</a></td>
                <td class="p-3 font-bold text-brown-600">${order.total.toLocaleString()} so'm</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Failed to fetch orders", err);
    }
};

const fetchProducts = async () => {
    try {
        const res = await fetch('/api/products');
        const products = await res.json();
        const list = document.getElementById('admin-products-list');
        list.innerHTML = '';
        products.forEach(p => {
            list.innerHTML += `
                <div class="border rounded p-4 flex flex-col bg-gray-50">
                    <img src="${p.image}" class="h-32 object-cover rounded mb-2">
                    <h3 class="font-bold">${p.name_uz}</h3>
                    <p class="text-brown-600 font-bold mb-2">${p.price.toLocaleString()} so'm</p>
                    <button onclick="deleteProduct(${p.id})" class="mt-auto bg-red-500 text-white py-1 rounded hover:bg-red-600"><i class="fas fa-trash"></i> O'chirish</button>
                </div>
            `;
        });
    } catch (err) {
        console.error("Failed to fetch products", err);
    }
};

const deleteProduct = async (id) => {
    if(confirm("Haqiqatan ham o'chirmoqchimisiz?")) {
        await fetch(`/api/products/${id}`, { method: 'DELETE' });
        fetchProducts();
    }
};

document.getElementById('add-product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newProduct = {
        name_uz: document.getElementById('p-name-uz').value,
        name_ru: document.getElementById('p-name-ru').value,
        price: parseInt(document.getElementById('p-price').value),
        image: document.getElementById('p-image').value,
        desc_uz: document.getElementById('p-desc-uz').value,
        desc_ru: document.getElementById('p-desc-ru').value,
    };
    await fetch('/api/products', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(newProduct)
    });
    document.getElementById('add-product-modal').classList.add('hidden');
    document.getElementById('add-product-form').reset();
    fetchProducts();
});

// Init
fetchOrders();
