/* ==========================================================================
   cart.js – handles cart UI + add-to-cart
   ========================================================================== */

$(document).ready(function () {
    

    // ------------------------------------------------------------------
    // CSRF
    // ------------------------------------------------------------------
    function getCsrfToken() {
        if (window.csrf_token) return window.csrf_token;

        var meta = document.querySelector("meta[name='csrf-token']");
        if (meta) return meta.getAttribute("content");

        var match = document.cookie.split("; ").find(r => r.startsWith("csrftoken="));
        return match ? match.split("=")[1] : "";
    }

    // ------------------------------------------------------------------
    // API wrapper (FIXED)
    // ------------------------------------------------------------------
   function callApi(method, args, callback, errCallback) {
    fetch("/api/method/" + method, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Frappe-CSRF-Token": window.frappe_boot?.csrf_token || ""
        },
        credentials: "include", // keeps session alive
        body: JSON.stringify(args),
    })
    .then(async (res) => {
        const data = await res.json().catch(() => null);

        if (!res.ok) {
            throw data || new Error("API error");
        }

        const msg = data.message ?? data;
        callback && callback(msg);
    })
    .catch((err) => {
        console.error("API error:", method, err);
        errCallback && errCallback(err);
    });
}
    // ------------------------------------------------------------------
    // UI helpers
    // ------------------------------------------------------------------
    function updateCartBadge(count) {
        $(".cart-nav span").text("(" + (count || 0) + ")");
    }

    function updateCartTotal(total) {
        $(".summary-table li").each(function () {
            var label = $(this).find("span:first").text().toLowerCase();
            if (label.includes("subtotal") || label.includes("total")) {
                $(this).find("span:last").text("$" + parseFloat(total || 0).toFixed(2));
            }
        });
    }

    function showToast(msg, type = "success") {
        var color = type === "error" ? "#e74c3c" : "#2ecc71";

        var t = $('<div class="cart-toast">' + msg + "</div>");
        t.css({
            position: "fixed",
            bottom: "30px",
            right: "30px",
            background: color,
            color: "#fff",
            padding: "10px 20px",
            borderRadius: "5px",
            zIndex: 9999
        });

        $("body").append(t);

        setTimeout(() => t.fadeOut(300, () => t.remove()), 2500);
    }

    // ------------------------------------------------------------------
    // 1. ADD TO CART
    // ------------------------------------------------------------------
document.addEventListener("click", function (e) {
    const btn = e.target.closest(".tests");
    if (!btn) return;

    e.preventDefault();

    const itemCode = btn.getAttribute("data-item");

    if (!itemCode) {
        showToast("Missing item code", "error");
        return;
    }

    console.log("adding item:", itemCode);
    getGuestId();

    callApi(
        "munya_shop.www.cart.add_to_cart",
        {
            item_code: itemCode,
            qty: 1,
            guest_id: localStorage.getItem("guest_id") || ""
        },
        function (data) {
            updateCartBadge(data.cart_count || 0);
            showToast("Added to cart ✔");
        }
    );
});
    // ------------------------------------------------------------------
    // 2. QUANTITY CHANGE
    // ------------------------------------------------------------------
    $(document).on("click", ".qty-minus, .qty-plus", function () {
        getGuestId();
        var $row = $(this).closest("tr");
        var itemCode = $row.data("item-code");
        var $input = $row.find(".qty-text");

        var qty = parseInt($input.val()) || 1;
        qty = $(this).hasClass("qty-plus") ? qty + 1 : Math.max(1, qty - 1);

        $input.val(qty);
        syncQty(itemCode, qty, $row);
    });

    $(document).on("change", ".qty-text", function () {
        var $row = $(this).closest("tr");
        syncQty($row.data("item-code"), parseInt($(this).val()) || 1, $row);
    });

    function syncQty(itemCode, qty, $row) {
        callApi(
            "munya_shop.www.cart.update_qty",
            { item_code: itemCode, qty: qty },
            function (data) {
                updateCartBadge(data.cart_count);
                updateCartTotal(data.cart_total);

                if (data.item_subtotal) {
                    $row.find(".item-subtotal").text("$" + data.item_subtotal);
                }
            }
        );
    }

    // ------------------------------------------------------------------
    // 3. REMOVE ITEM
    // ------------------------------------------------------------------
    $(document).on("click", ".remove-cart-item", function () {
        var $row = $(this).closest("tr");

        callApi(
            "munya_shop.www.cart.remove_from_cart",
            { item_code: $row.data("item-code") },
            function (data) {
                $row.fadeOut(200, () => $row.remove());

                updateCartBadge(data.cart_count);
                updateCartTotal(data.cart_total);
            }
        );
    });

    // ------------------------------------------------------------------
    // 4. LOAD CART COUNT ON PAGE LOAD
    // ------------------------------------------------------------------
    callApi("munya_shop.www.cart.get_cart_count", {}, function (data) {
        updateCartBadge(data.cart_count);
    });

});


// 1. Recalculate totals based on row data
function refreshCartTotals() {
    let subtotal = 0;
    
    document.querySelectorAll('.cart-item-row').forEach(row => {
        const price = parseFloat(row.querySelector('.item-price').textContent) || 0;
        const qty = parseInt(row.querySelector('.qty-text').value) || 0;
        subtotal += (price * qty);
    });

    const totalStr = `$${subtotal.toFixed(2)}`;
    
    // Target the Summary IDs
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    
    if(subtotalEl) subtotalEl.textContent = totalStr;
    if(totalEl) totalEl.textContent = totalStr;
}

// 2. Push change to Frappe
function updateCartDB(element) {
    const row = element.closest('.cart-item-row');
    const itemCode = row.dataset.itemCode;
    const qty = row.querySelector('.qty-text').value;

    callApi("munya_shop.www.cart.add_to_cart", {
        item_code: itemCode,
        qty: qty,
        is_set_qty: true // Custom flag for your Python to use doc.qty = qty
    }, function(data) {
        refreshCartTotals(); 
    });
}

// 3. Run on page load
document.addEventListener("DOMContentLoaded", refreshCartTotals);