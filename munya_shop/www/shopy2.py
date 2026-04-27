import frappe
import math

def get_context(context):
    # 1. PARAMS
    page = frappe.form_dict.get("page")
    page = int(page) if page and str(page).isdigit() else 1
    
    page_length = 4
    group = frappe.form_dict.get("group")

    # 2. FILTERS
    filters = {"disabled": 0}
    if group:
        filters["item_group"] = group

    # 3. PAGINATION CALCS
    total_items = frappe.db.count("Item", filters)
    total_pages = max(1, math.ceil(total_items / page_length))
    page = max(1, min(page, total_pages))

    # 4. DATA FETCHING
    items = frappe.get_all(
        "Item",
        fields=["name", "item_name", "item_group", "image", "custom_is_trendy", "custom_just_arrived"],
        filters=filters,
        order_by="item_name asc",
        limit_start=(page - 1) * page_length,
        limit_page_length=page_length
    )

    # Fetch Prices
    prices = frappe.get_all(
        "Item Price",
        fields=["item_code", "price_list_rate", "custom_price_before"],
        filters={"selling": 1}
    )
    price_map = {p.item_code: p for p in prices}

    for item in items:
        p = price_map.get(item.name)
        item.selling_price = p.price_list_rate if p else None
        item.custom_price_before = p.custom_price_before if p else None

    # Item Groups
    item_groups = frappe.get_all(
        "Item Group",
        fields=["name", "item_group_name", "image"],
        filters={"custom_disabled": 0},
        order_by="item_group_name asc"
    )

    # 5. CONTEXT OUTPUT
    context.items = items
    context.item_groups = item_groups
    context.current_page = page
    context.total_pages = total_pages
    context.selected_group = group
    
    # Flags for UI
    context.has_prev = page > 1
    context.has_next = page < total_pages

    return context