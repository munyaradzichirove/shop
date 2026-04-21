document.querySelectorAll(".add-to-cart").forEach(btn => {
    btn.addEventListener("click", async function (e) {
        e.preventDefault();

        const item_code = this.dataset.item;

        const res = await fetch("/api/method/munya_shop.www.cart.add_to_cart", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                item_code: item_code,
                qty: 1
            })
        });

        const data = await res.json();
        console.log("cart response:", data);
    });
});