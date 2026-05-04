function setCookie(name, value, days = 365) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}

function getGuestId() {
    let id = localStorage.getItem("guest_id");

    if (!id) {
        // 🔥 FIX: Check if crypto.randomUUID exists, otherwise use fallback
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            id = crypto.randomUUID();
        } else {
            // Manual UUID generator for non-HTTPS/Localhost environments
            id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
        
        localStorage.setItem("guest_id", id);
        setCookie("guest_id", id); 
    }

    return id;
}
function changeQty(amount, element) {
    // 1. Find the parent quantity div
    const container = element.closest('.quantity');
    // 2. Find the input inside that specific container
    const input = container.querySelector('input[name="quantity"]');
    
    if (input) {
        let currentVal = parseInt(input.value) || 1;
        let newVal = currentVal + amount;
        
        // 3. Keep it within min/max bounds
        const min = parseInt(input.getAttribute('min')) || 1;
        const max = parseInt(input.getAttribute('max')) || 300;
        
        if (newVal >= min && newVal <= max) {
            input.value = newVal;
        }
    }
}
function callApi(method, args, callback, errCallback) {
    console.log("main cart request");

    fetch("/api/method/" + method, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Frappe-CSRF-Token": window.frappe_boot?.csrf_token || ""
        },
        credentials: "include",
        body: JSON.stringify(args),
    })
    .then(async (res) => {
        const data = await res.json().catch(() => null);

        if (!res.ok) {
            throw data || new Error("API error");
        }

        callback && callback(data.message);
    })
    .catch((err) => {
        console.error("API error:", method, err);
        errCallback && errCallback(err);
    });
}

// ... rest of your UI functions (updateCartBadge, showToast, etc.)
function updateCartBadge(count) {
    const el = document.querySelector(".cart-nav span");
    if (el) el.textContent = "(" + (count || 0) + ")";
}
function showToast(message, type = "success") {
    const toast = document.createElement("div");

    toast.textContent = message;

    toast.style.position = "fixed";
    toast.style.bottom = "30px";
    toast.style.right = "30px";
    toast.style.padding = "12px 20px";
    toast.style.color = "#fff";
    toast.style.borderRadius = "6px";
    toast.style.zIndex = 9999;
    toast.style.fontSize = "14px";
    toast.style.boxShadow = "0 4px 10px rgba(0,0,0,0.2)";

    toast.style.background =
        type === "error" ? "#e74c3c" : "#2ecc71";

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 2500);
}
document.addEventListener("submit", function (e) {
    const form = e.target;

    if (!form.classList.contains("cart")) return;

    // e.preventDefault();

    const itemCode = form.dataset.itemCode;
    const price = form.dataset.price;
    const qty = parseInt(form.querySelector("[name='quantity']").value || 1);

    callApi(
        "munya_shop.www.cart.add_to_cart",
        {
            item_code: itemCode,
            qty: qty,
            price: price,
            guest_id: getGuestId()
        },
        function (data) {
            updateCartBadge(data.cart_count || 0);
            showToast("Added to cart ✔");
        }
    );
});