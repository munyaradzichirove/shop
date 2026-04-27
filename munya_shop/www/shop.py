import frappe
import math
import math
import frappe
aa
def get_context(context):

    # =========================
    # 1. GET PARAMS (SAFE)
    # =========================
    page = frappe.form_dict.get("page")
    page = int(page) if page and str(page).isdigit() else 1

    page_length = 200
    group = frappe.form_dict.get("group")

    # =========================
    # 2. BUILD FILTERS
    # =========================
    filters = {"disabled": 0}

    if group:
        filters["item_group"] = group

    # =========================
    # 3. TOTAL ITEMS (RESPECT FILTERS)
    # =========================
    total_items = frappe.db.count("Item", filters)
    total_pages = max(1, math.ceil(total_items / page_length))

    # clamp page BEFORE querying
    page = max(1, min(page, total_pages))

    # =========================
    # 4. GET ITEMS (PAGINATED)
    # =========================
    items = frappe.get_all(
        "Item",
        fields=[
            "name",
            "item_name",
            "item_group",
            "image",
            "custom_is_trendy",
            "custom_just_arrived"
        ],
        filters=filters,
        order_by="item_name asc",
        limit_start=(page - 1) * page_length,
        limit_page_length=page_length
    )

    # =========================
    # 5. GET PRICES (OPTIMISED MAP)
    # =========================
    prices = frappe.get_all(
        "Item Price",
        fields=["item_code", "price_list_rate", "custom_price_before"],
        filters={"selling": 1}
    )

    price_map = {
        p.item_code: {
            "selling_price": p.price_list_rate,
            "custom_price_before": p.custom_price_before
        }
        for p in prices
    }

    for item in items:
        p = price_map.get(item.name)
        item.selling_price = p["selling_price"] if p else None
        item.custom_price_before = p["custom_price_before"] if p else None

    # =========================
    # 6. ITEM GROUPS + COUNTS
    # =========================
    item_counts = frappe.db.sql("""
        SELECT item_group, COUNT(*) as count
        FROM `tabItem`
        WHERE disabled = 0
        GROUP BY item_group
    """, as_dict=True)

    count_map = {d.item_group: d.count for d in item_counts}

    item_groups = frappe.get_all(
        "Item Group",
        fields=["name", "item_group_name", "image"],
        filters={"custom_disabled": 0},
        order_by="item_group_name asc"
    )

    for g in item_groups:
        g.item_count = count_map.get(g.name, 0)

    # =========================
    # 7. CONTEXT OUTPUT
    # =========================
    context.items = items
    context.item_groups = item_groups

    context.current_page = page
    context.total_pages = total_pages
    context.selected_group = group  # for UI active state

    return context