document.addEventListener("DOMContentLoaded", () => {
    loadCategories();
    loadProducts();
    document.getElementById("productForm").addEventListener("submit", addProduct);
});

// ✅ Load categories into the dropdown
function loadCategories() {
    fetch("/api/categories")
        .then((res) => res.json())
        .then((categories) => {
            const categorySelect = document.getElementById("categorySelect");
            categorySelect.innerHTML = `<option value="">Select Category</option>`;
            categories.forEach((category) => {
                categorySelect.innerHTML += `<option value="${category.category_id}">${category.name}</option>`;
            });
        })
        .catch((error) => console.error("❌ Error loading categories:", error));
}

// ✅ Load products
function loadProducts() {
    fetch("/api/products")
        .then((res) => res.json())
        .then((products) => {
            const tbody = document.getElementById("productList");
            tbody.innerHTML = "";
            products.forEach((product) => {
                tbody.innerHTML += `
                    <tr>
                        <td>${product.product_id}</td>
                        <td>${product.name}</td>
                        <td>${product.category_name}</td>
                        <td>${product.price}</td>
                        <td>${product.stock_quantity}</td>
                    </tr>
                `;
            });
        })
        .catch((error) => console.error("❌ Error loading products:", error));
}

// ✅ Add a new product
function addProduct(event) {
    event.preventDefault();
    
    const name = document.getElementById("product_name").value;
    const category_id = document.getElementById("categorySelect").value;
    const price = document.getElementById("price").value;
    const stock_quantity = document.getElementById("stock").value;

    if (!category_id) {
        alert("Please select a category");
        return;
    }

    fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category_id, price, stock_quantity }),
    })
        .then((res) => res.json())
        .then(() => {
            loadProducts();
            document.getElementById("productForm").reset();
        })
        .catch((error) => console.error("❌ Error adding product:", error));
}
