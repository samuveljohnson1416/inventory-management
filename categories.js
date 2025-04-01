document.addEventListener("DOMContentLoaded", () => {
    loadCategories();
    document.getElementById("categoryForm").addEventListener("submit", addCategory);
});

// ✅ Load categories into the table
function loadCategories() {
    fetch("/api/categories")
        .then((res) => res.json())
        .then((categories) => {
            const tbody = document.getElementById("categoryList");
            tbody.innerHTML = "";
            categories.forEach((category) => {
                tbody.innerHTML += `
                    <tr>
                        <td>${category.category_id}</td>
                        <td>${category.name}</td>
                        <td><button onclick="deleteCategory(${category.category_id})">❌ Delete</button></td>
                    </tr>
                `;
            });
        })
        .catch((error) => console.error("❌ Error loading categories:", error));
}

// ✅ Add a new category
function addCategory(event) {
    event.preventDefault();

    const name = document.getElementById("category_name").value;

    fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
    })
        .then((res) => res.json())
        .then(() => {
            loadCategories();
            document.getElementById("categoryForm").reset();
        })
        .catch((error) => console.error("❌ Error adding category:", error));
}

// ✅ Delete a category
function deleteCategory(category_id) {
    if (!confirm("Are you sure you want to delete this category?")) return;

    fetch(`/api/categories/${category_id}`, { method: "DELETE" })
        .then(() => loadCategories())
        .catch((error) => console.error("❌ Error deleting category:", error));
}
