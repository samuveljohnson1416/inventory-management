const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ✅ Database connection
const db = mysql.createConnection({
    host: "localhost",
    user: "single007",
    password: "single007",
    database: "inventory_db",
});

db.connect((err) => {
    if (err) {
        console.error("❌ Database connection failed:", err.message);
        process.exit(1);
    } else {
        console.log("✅ Connected to MySQL Database");
    }
});

// ✅ Get all products
app.get("/api/products", (req, res) => {
    db.query(
        "SELECT p.product_id, p.name, c.category_id, c.name AS category_name, p.price, p.stock_quantity FROM products p LEFT JOIN categories c ON p.category_id = c.category_id",
        (err, results) => {
            if (err) {
                console.error("❌ Error fetching products:", err.message);
                return res.status(500).json({ error: "Failed to fetch products" });
            }
            res.json(results);
        }
    );
});

// ✅ Add a product
app.post("/api/products", (req, res) => {
    const { name, category_id, price, stock_quantity } = req.body;
    if (!name || !category_id || price < 0 || stock_quantity < 0) {
        return res.status(400).json({ error: "Invalid product data" });
    }

    db.query(
        "INSERT INTO products (name, category_id, price, stock_quantity) VALUES (?, ?, ?, ?)",
        [name, category_id, price, stock_quantity],
        (err, result) => {
            if (err) {
                console.error("❌ Error adding product:", err.message);
                return res.status(500).json({ error: "Failed to add product" });
            }
            res.json({ message: "✅ Product added successfully", product_id: result.insertId });
        }
    );
});

// ✅ Get all categories
app.get("/api/categories", (req, res) => {
    db.query("SELECT * FROM categories", (err, results) => {
        if (err) {
            console.error("❌ Error fetching categories:", err.message);
            return res.status(500).json({ error: "Failed to fetch categories" });
        }
        res.json(results);
    });
});

// ✅ Add a new category
app.post("/api/categories", (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: "Category name is required" });
    }

    db.query("INSERT INTO categories (name) VALUES (?)", [name], (err, result) => {
        if (err) {
            console.error("❌ Error adding category:", err.message);
            return res.status(500).json({ error: "Failed to add category" });
        }
        res.json({ message: "✅ Category added successfully", category_id: result.insertId });
    });
});
// ✅ Delete a category
app.delete("/api/categories/:category_id", (req, res) => {
    const { category_id } = req.params;
    
    db.query("DELETE FROM categories WHERE category_id = ?", [category_id], (err, result) => {
        if (err) {
            console.error("❌ Error deleting category:", err.message);
            return res.status(500).json({ error: "Failed to delete category" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Category not found" });
        }
        res.json({ message: "✅ Category deleted successfully" });
    });
});

// ✅ Get all customers
app.get("/api/customers", (req, res) => {
    db.query("SELECT * FROM customers", (err, results) => {
        if (err) {
            console.error("❌ Error fetching customers:", err.message);
            return res.status(500).json({ error: "Failed to fetch customers" });
        }
        res.json(results);
    });
});

// ✅ Get all orders (Including order details)
app.get("/api/orders", (req, res) => {
    db.query(
        `SELECT o.order_id, c.name AS customer_name, p.name AS product_name, 
                od.quantity, o.total_amount, o.order_date 
         FROM orders o 
         JOIN customers c ON o.customer_id = c.customer_id 
         JOIN order_details od ON o.order_id = od.order_id 
         JOIN products p ON od.product_id = p.product_id
         ORDER BY o.order_date DESC`,
        (err, results) => {
            if (err) {
                console.error("❌ Error fetching orders:", err.message);
                return res.status(500).json({ error: "Failed to fetch orders" });
            }
            res.json(results);
        }
    );
});

app.post("/api/orders", (req, res) => {
    const { customer_id, product_id, quantity } = req.body;

    if (!customer_id || !product_id || quantity <= 0) {
        return res.status(400).json({ error: "Invalid order data" });
    }

    db.beginTransaction((err) => {
        if (err) {
            console.error("❌ Transaction start failed:", err.message);
            return res.status(500).json({ error: "Transaction start failed" });
        }

        db.query("SELECT price, stock_quantity FROM products WHERE product_id = ?", [product_id], (err, result) => {
            if (err) {
                return db.rollback(() => res.status(500).json({ error: "Failed to fetch product" }));
            }
            if (result.length === 0) {
                return db.rollback(() => res.status(404).json({ error: "Product not found" }));
            }

            const productPrice = result[0].price;
            const stockQuantity = result[0].stock_quantity;
            if (stockQuantity < quantity) {
                return db.rollback(() => res.status(400).json({ error: "Insufficient stock" }));
            }

            const total_amount = productPrice * quantity;

            db.query("INSERT INTO orders (customer_id, total_amount, order_date) VALUES (?, ?, NOW())",
                [customer_id, total_amount],
                (err, orderResult) => {
                    if (err) {
                        return db.rollback(() => res.status(500).json({ error: "Order creation failed" }));
                    }

                    const order_id = orderResult.insertId;

                    db.query(
                        "INSERT INTO order_details (order_id, product_id, quantity, subtotal) VALUES (?, ?, ?, ?)",
                        [order_id, product_id, quantity, productPrice * quantity],
                        (err) => {
                            if (err) {
                                return db.rollback(() => res.status(500).json({ error: "Failed to add order details" }));
                            }

                            db.query("UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?",
                                [quantity, product_id],
                                (err) => {
                                    if (err) {
                                        return db.rollback(() => res.status(500).json({ error: "Failed to update stock" }));
                                    }

                                    db.commit((err) => {
                                        if (err) {
                                            return res.status(500).json({ error: "Transaction commit failed" });
                                        }
                                        res.json({ message: "Order placed successfully", order_id });
                                    });
                                }
                            );
                        }
                    );
                }
            );
        });
    });
});
app.post("/api/customers", (req, res) => {
    const { name, email, phone } = req.body;

    if (!name || !email || !phone) {
        return res.status(400).json({ error: "All fields are required" });
    }

    db.query(
        "INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)",
        [name, email, phone],
        (err, result) => {
            if (err) {
                console.error("❌ Error adding customer:", err.message);
                return res.status(500).json({ error: "Failed to add customer" });
            }
            res.json({ message: "✅ Customer added successfully", customer_id: result.insertId });
        }
    );
});


// ✅ Start the server
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));