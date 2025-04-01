// ✅ Load all orders into the table
async function loadOrders() {
    try {
        const response = await fetch("http://localhost:5000/api/orders");
        if (!response.ok) {
            throw new Error(`❌ Failed to fetch orders: ${response.statusText}`);
        }
        const orders = await response.json();

        console.log("🔍 API Response (Orders):", orders);

        if (!Array.isArray(orders)) {
            throw new Error("❌ API did not return an array");
        }

        const orderList = document.getElementById("orderList");
        orderList.innerHTML = ""; // Clear previous list

        orders.forEach((order) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${order.order_id}</td>
                <td>${order.customer_name}</td>
                <td>${order.product_name}</td>
                <td>${order.quantity}</td>
                <td>$${Number(order.total_amount).toFixed(2)}</td>
                <td>${new Date(order.order_date).toLocaleString()}</td>
            `;
            orderList.appendChild(row);
        });
    } catch (error) {
        console.error("❌ Error loading orders:", error);
    }
}

// ✅ Load all customers into the select box
async function loadCustomers() {
    try {
        const response = await fetch("http://localhost:5000/api/customers");
        if (!response.ok) {
            throw new Error(`❌ Failed to fetch customers: ${response.statusText}`);
        }
        const customers = await response.json();

        console.log("🔍 API Response (Customers):", customers);

        const customerSelect = document.getElementById("customerSelect");
        customerSelect.innerHTML = `<option value="">Select Customer</option>`; // Clear and add default option

        customers.forEach((customer) => {
            const option = document.createElement("option");
            option.value = customer.customer_id;
            option.textContent = customer.name;
            customerSelect.appendChild(option);
        });
    } catch (error) {
        console.error("❌ Error loading customers:", error);
    }
}

// ✅ Load all products into the select box
async function loadProducts() {
    try {
        const response = await fetch("http://localhost:5000/api/products");
        if (!response.ok) {
            throw new Error(`❌ Failed to fetch products: ${response.statusText}`);
        }
        const products = await response.json();

        console.log("🔍 API Response (Products):", products);

        const productSelect = document.getElementById("productSelect");
        productSelect.innerHTML = `<option value="">Select Product</option>`; // Clear and add default option

        products.forEach((product) => {
            const option = document.createElement("option");
            option.value = product.product_id;
            option.textContent = product.name;
            productSelect.appendChild(option);
        });
    } catch (error) {
        console.error("❌ Error loading products:", error);
    }
}

// ✅ Handle form submission to place an order
document.getElementById("orderForm").addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent default form submission behavior

    const customer_id = document.getElementById("customerSelect").value;
    const product_id = document.getElementById("productSelect").value;
    const quantity = document.getElementById("quantity").value;

    if (!customer_id || !product_id || quantity <= 0) {
        alert("Please select a valid customer, product, and quantity.");
        return;
    }

    try {
        const response = await fetch("http://localhost:5000/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ customer_id, product_id, quantity }),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || "Failed to place order");
        }

        alert(result.message || "Order placed successfully!");
        loadOrders(); // Reload orders after placing a new one
    } catch (error) {
        console.error("❌ Error placing order:", error);
        alert("An error occurred while placing the order.");
    }
});

// Load all necessary data when the page loads
document.addEventListener("DOMContentLoaded", () => {
    loadOrders();    // Load orders into the table
    loadCustomers(); // Load customers into the select box
    loadProducts();  // Load products into the select box
});