@frappe.whitelist()
def add_to_cart(item_code, qty=1):
    print("adding to cart----------------")
    user = frappe.session.user

    if user == "Guest":
        frappe.throw("Please login first")

    item = frappe.get_doc("Item", item_code)

    frappe.get_doc({
        "doctype": "Cart Item",
        "user": user,
        "item": item_code,
        "item_name": item.item_name,
        "qty": qty,
        "price": frappe.db.get_value("Item Price", {"item_code": item_code, "selling": 1}, "price_list_rate")
    }).insert()

    return "ok"