document.addEventListener("DOMContentLoaded", () => {
    loadCustomers();
    document.getElementById("customerForm").addEventListener("submit", addCustomer);
});

// ✅ Load customers into the table
function loadCustomers() {
    fetch("/api/customers")
        .then((res) => res.json())
        .then((customers) => {
            const tbody = document.getElementById("customerList");
            tbody.innerHTML = "";
            customers.forEach((customer) => {
                tbody.innerHTML += `
                    <tr>
                        <td>${customer.customer_id}</td>
                        <td>${customer.name}</td>
                        <td>${customer.email}</td>
                        <td>${customer.phone}</td>
                        <td><button onclick="deleteCustomer(${customer.customer_id})">❌ Delete</button></td>
                    </tr>
                `;
            });
        })
        .catch((error) => console.error("❌ Error loading customers:", error));
}

// ✅ Add a new customer
function addCustomer(event) {
    event.preventDefault();

    const name = document.getElementById("customer_name").value;
    const email = document.getElementById("customer_email").value;
    const phone = document.getElementById("customer_phone").value;

    fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone }),
    })
        .then((res) => {
            if (!res.ok) {
                return res.text().then((text) => {
                    throw new Error(`HTTP ${res.status}: ${text}`);
                });
            }
            return res.json();
        })
        .then(() => {
            loadCustomers();
            document.getElementById("customerForm").reset();
        })
        .catch((error) => console.error("❌ Error adding customer:", error));
}

// ✅ Delete a customer
function deleteCustomer(customer_id) {
    if (!confirm("Are you sure you want to delete this customer?")) return;

    fetch(`/api/customers/${customer_id}`, { method: "DELETE" })
        .then(() => loadCustomers())
        .catch((error) => console.error("❌ Error deleting customer:", error));
}
