import frappe

def get_context(context):
    item_code = frappe.request.args.get("item")

    if not item_code:
        context.item = None
        return context

    item = frappe.get_doc("Item", item_code)

    # build image list safely
    images = []

    if item.image:
        images.append(item.image)

    if getattr(item, "custom_image_2", None):
        images.append(item.custom_image_2)

    if getattr(item, "custom_image_3", None):
        images.append(item.custom_image_3)
    
    if getattr(item, "custom_image_4", None):
        images.append(item.custom_image_4)

    context.item = item
    context.images = images

    # optional price
    context.price = frappe.db.get_value(
        "Item Price",
        {"item_code": item_code, "selling": 1},
        ["price_list_rate", "custom_price_before"],
        as_dict=True
    )

    return context