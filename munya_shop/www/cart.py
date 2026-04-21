import frappe

@frappe.whitelist(allow_guest=True)
def add_to_cart(item_code, qty=1):

    user = frappe.session.user

    # GUEST CART (session-based)
    if user == "Guest":
        cart = frappe.session.get("cart") or []

        cart.append({
            "item_code": item_code,
            "qty": int(qty)
        })

        frappe.session["cart"] = cart
        return {"status": "guest_cart", "cart": cart}

    # LOGGED IN CART (DB-based)
    item = frappe.get_doc("Item", item_code)

    frappe.get_doc({
        "doctype": "Cart Item",
        "user": user,
        "item": item_code,
        "item_name": item.item_name,
        "qty": qty,
        "price": frappe.db.get_value(
            "Item Price",
            {"item_code": item_code, "selling": 1},
            "price_list_rate"
        )
    }).insert()

    return {"status": "db_cart", "message": "added"}