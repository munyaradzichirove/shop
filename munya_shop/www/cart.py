import frappe
from frappe.utils import flt, cint

def get_identity():
    user = frappe.session.user

    if user != "Guest":
        return user

    return frappe.request.cookies.get("guest_id")

@frappe.whitelist(allow_guest=True)
def get_cart_count(guest_id=None):
    user = frappe.session.user if frappe.session.user != "Guest" else guest_id

    if not user:
        return {"cart_count": 0}

    count = frappe.db.count("Cart Item", {
        "cart_owner": user
    })

    return {"cart_count": count}

@frappe.whitelist(allow_guest=True)
def add_to_cart(item_code, qty=1, guest_id=None):
    print(f"adding item-now-----{item_code}---")
    identity = get_identity()
        # Fetch price
    selling_price = frappe.db.get_value("Item Price", 
        {"item_code": item_code, "price_list": "Standard Selling"}, 
        "price_list_rate") 
    print(f"selling price {selling_price}")

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



    # Create the doc
    doc = frappe.get_doc({
        "doctype": "Cart Item",
        "cart_owner": identity,
        "item": item_code,
        "qty": int(qty),
        "rate": flt(selling_price),
    })

    # Set flags BEFORE inserting
    doc.flags.ignore_permissions = True
    doc.insert() # <--- ONLY ONE INSERT

    return {
        "status": "created",
        "name": doc.name,
        "item": item_code,
        "qty": doc.qty
    }
def get_context(context):
    guest_id = frappe.form_dict.get("guest_id")
    identity = get_identity()
    print(f"identity is {identity}")

    context.cart = frappe.get_all(
        "Cart Item",
        filters={"cart_owner": identity},
        fields=["item", "qty", "rate", "image"]
    ) or []


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