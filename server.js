const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'database.json');

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Helper to read DB
const readDB = () => {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
};

// Helper to write DB
const writeDB = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
};

// --- API ROUTES ---

// Get all products
app.get('/api/products', (req, res) => {
    try {
        const db = readDB();
        res.json(db.products);
    } catch (err) {
        res.status(500).json({ error: 'Failed to read database' });
    }
});

// Create a new order
app.post('/api/orders', (req, res) => {
    try {
        const db = readDB();
        const newOrder = {
            id: Date.now(),
            date: new Date().toLocaleString('uz-UZ'),
            ...req.body
        };
        db.orders.push(newOrder);
        writeDB(db);
        res.status(201).json({ success: true, orderId: newOrder.id });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save order' });
    }
});

// Get all orders (For Admin)
app.get('/api/orders', (req, res) => {
    try {
        const db = readDB();
        res.json(db.orders);
    } catch (err) {
        res.status(500).json({ error: 'Failed to read orders' });
    }
});

// Add a new product (For Admin)
app.post('/api/products', (req, res) => {
    try {
        const db = readDB();
        const newProduct = {
            id: db.products.length > 0 ? Math.max(...db.products.map(p => p.id)) + 1 : 1,
            ...req.body
        };
        db.products.push(newProduct);
        writeDB(db);
        res.status(201).json({ success: true, product: newProduct });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add product' });
    }
});

// Delete a product (For Admin)
app.delete('/api/products/:id', (req, res) => {
    try {
        const db = readDB();
        const productId = parseInt(req.params.id);
        db.products = db.products.filter(p => p.id !== productId);
        writeDB(db);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
