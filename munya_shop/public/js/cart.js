document.querySelectorAll(".add-to-cart").forEach(btn => {
    btn.addEventListener("click", async function (e) {
        e.preventDefault();

        const item_code = this.dataset.item;

        try {
            const res = await fetch("/api/method/munya_shop.www.cart.add_to_cart", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // "X-Frappe-CSRF-Token": frappe.csrf_token
                },
                body: JSON.stringify({
                    item_code: item_code,
                    qty: 1
                })
            });

            const data = await res.json();

            if (data.message) {
                showToast("🛒 Added to cart!");
            } else {
                showToast("Added!", "success");
            }

        } catch (err) {
            console.error(err);
            showToast("Failed to add item", "error");
        }
    });
});

function showToast(message, type = "success") {
    const toast = document.createElement("div");

    toast.innerText = message;

    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.right = "20px";
    toast.style.padding = "12px 18px";
    toast.style.borderRadius = "6px";
    toast.style.color = "white";
    toast.style.zIndex = "9999";
    toast.style.fontSize = "14px";
    toast.style.boxShadow = "0 6px 20px rgba(0,0,0,0.15)";
    toast.style.background =
        type === "success" ? "#28a745" :
        type === "error" ? "#dc3545" : "#333";

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 2000);
}