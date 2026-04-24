import frappe


def get_identity(guest_id):
    if frappe.session.user != "Guest":
        return frappe.session.user
    return guest_id

@frappe.whitelist(allow_guest=True)
def add_to_cart(item_code, qty=1, guest_id=None):
    identity = get_identity(guest_id)

    existing = frappe.db.get_value(
        "Cart Item",
        {"cart_owner": identity, "item": item_code},
        "name"
    )

    if existing:
        doc = frappe.get_doc("Cart Item", existing)
        doc.qty += int(qty)
        doc.flags.ignore_permissions = True
        doc.save()

        return {
            "status": "updated",
            "item": item_code,
            "qty": doc.qty
        }

    doc = frappe.get_doc({
        "doctype": "Cart Item",
        "cart_owner": identity,
        "item": item_code,
        "qty": int(qty)
    })

    doc.flags.ignore_permissions = True
    doc.insert()

    return {
        "status": "created",
        "name": doc.name,
        "item": item_code,
        "qty": doc.qty
    }
def get_context(context):
    guest_id = frappe.form_dict.get("guest_id")
    identity = get_identity(guest_id)

    context.cart = frappe.get_all(
        "Cart Item",
        filters={"cart_owner": identity},
        fields=["item", "qty", "price"]
    )


def merge_cart_on_login(login_manager):
    print("on login hit")
    user = frappe.session.user

    # get guest_id from request cookies or params
    guest_id = frappe.form_dict.get("guest_id")

    if not guest_id:
        return

    guest_items = frappe.get_all(
        "Cart Item",
        filters={"cart_owner": guest_id},
        fields=["name", "item", "qty"]
    )

    for g in guest_items:
        existing = frappe.db.get_value(
            "Cart Item",
            {"cart_owner": user, "item": g.item},
            "name"
        )

        if existing:
            doc = frappe.get_doc("Cart Item", existing)
            doc.qty += g.qty
            doc.flags.ignore_permissions = True
            doc.save()
        else:
            doc = frappe.get_doc({
                "doctype": "Cart Item",
                "cart_owner": user,
                "item": g.item,
                "qty": g.qty
            })
            doc.flags.ignore_permissions = True
            doc.insert()

        frappe.delete_doc("Cart Item", g.name, ignore_permissions=True)