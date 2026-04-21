document.querySelectorAll(".add-to-cart").forEach(btn => {
    console.log("btn clicked");
    btn.addEventListener("click", function(e) {
        e.preventDefault();

        let item_code = this.getAttribute("data-item");

        frappe.call({
            method: "munta_shop.www.cart.add_to_cart",
            args: {
                item_code: item_code,
                qty: 1
            },
            callback: function(r) {
                frappe.show_alert({
                    message: "Added to cart 🛒",
                    indicator: "green"
                });
            }
        });
    });
});


