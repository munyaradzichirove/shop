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

def merge_cart(guest_id):
    user = frappe.session.user

    guest_items = frappe.get_all("Cart Item", filters={"cart_owner": guest_id})

    for item in guest_items:
        doc = frappe.get_doc("Cart Item", item.name)
        doc.cart_owner = user
        doc.save()