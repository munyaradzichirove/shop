import frappe

@frappe.whitelist(allow_guest=True)
def add_to_cart(item_code, qty=1):
    user = frappe.session.user

    price = frappe.db.get_value(
        "Item Price",
        {"item_code": item_code, "selling": 1},
        "price_list_rate"
    )

    item_name = frappe.db.get_value("Item", item_code, "item_name")

    # guest cart (session)
    if user == "Guest":
        cart = frappe.session.get("cart") or []

        for c in cart:
            if c["item"] == item_code:
                c["qty"] += int(qty)
                break
        else:
            cart.append({
                "item": item_code,
                "item_name": item_name,
                "qty": int(qty),
                "price": price
            })

        frappe.session["cart"] = cart
        return {"status": "guest", "cart": cart}

    # logged-in cart
    doc = frappe.get_doc({
        "doctype": "Cart Item",
        "user": user,
        "item": item_code,
        "item_name": item_name,
        "qty": qty,
        "price": price
    }).insert()

    return {"status": "db", "id": doc.name}