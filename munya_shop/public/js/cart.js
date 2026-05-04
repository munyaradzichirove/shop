/* ==========================================================================
   cart.js – handles cart UI + add-to-cart
   ========================================================================== */

$(document).ready(function () {

    // 1. API Wrapper
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

    // 2. UI Helpers
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
        t.css({ position: "fixed", bottom: "30px", right: "30px", background: color, color: "#fff", padding: "10px 20px", borderRadius: "5px", zIndex: 9999 });
        $("body").append(t);
        setTimeout(() => t.fadeOut(300, () => t.remove()), 2500);
    }

    // 3. Shop Page: Add to Cart button logic
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

    // 4. Cart Page: Quantity Change logic
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
            refreshCartTotals(); // Recalculate sidebar totals
        });
    }

    // 5. Initial Load
    refreshCartTotals();
    callApi("munya_shop.www.cart.get_cart_count", {}, function (data) {
        updateCartBadge(data.cart_count);
    });
});