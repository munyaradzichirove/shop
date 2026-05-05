/* ==========================================================================
   cart.js – handles cart UI + add-to-cart + user sessions
   ========================================================================== */

$(document).ready(function () {

    // 1. API Wrapper (Handles CSRF and Fetch)
    function callApi(method, args, callback, errCallback) {
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
            if (!res.ok) throw data || new Error("API error");
            const msg = data.message ?? data;
            callback && callback(msg);
        })
        .catch((err) => {
            console.error("API error:", method, err);
            errCallback && errCallback(err);
        });
    }

    // 2. EXPOSED LOGOUT FUNCTION
    // Attached to window inside ready block so it can use callApi
    window.logout = function(e) {
        if (e && e.preventDefault) e.preventDefault();
        
        console.log("Attempting logout via callApi...");

        callApi(
            "munya_shop.www.logout.logout_user", 
            {}, 
            function(response) {
                console.log("Logout successful");
                window.location.href = "/login";
            },
            function(err) {
                console.error("Logout failed", err);
                window.location.href = "/login";
            }
        );
    };

    // 3. UI Helpers
    function updateCartBadge(count) {
        $(".cart-nav span").text("(" + (count || 0) + ")");
    }

    function refreshCartTotals() {
        let subtotal = 0;
        $('.cart-item-row').each(function() {
            const price = parseFloat($(this).find('.item-price').text()) || 0;
            const qty = parseInt($(this).find('.qty-text').val()) || 0;
            subtotal += (price * qty);
        });
        const totalStr = "$" + subtotal.toFixed(2);
        $('#cart-subtotal, #cart-total').text(totalStr);
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

    // 4. Shop Page: Add to Cart button logic
    $(document).on("click", ".tests", function (e) {
        e.preventDefault();
        const itemCode = $(this).attr("data-item");
        if (!itemCode) return showToast("Missing item code", "error");

        callApi("munya_shop.www.cart.add_to_cart", {
            item_code: itemCode,
            qty: 1
        }, function (data) {
            updateCartBadge(data.cart_count || 0);
            showToast("Added to cart ✔");
        });
    });

    // 5. Cart Page: Quantity Change logic
    $(document).on("click", ".qty-minus, .qty-plus", function () {
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
        callApi("munya_shop.www.cart.add_to_cart", { 
            item_code: itemCode, 
            qty: qty, 
            is_set_qty: true 
        }, function (data) {
            updateCartBadge(data.cart_count);
            refreshCartTotals(); 
        });
    }

    // 6. Initial Load
    refreshCartTotals();

});