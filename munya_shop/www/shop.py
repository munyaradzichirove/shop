import frappe
import math

def get_context(context):

    # =========================
    # 1. PAGINATION SETTINGS
    # =========================
    page = int(frappe.form_dict.get("page") or 1)
    page_length = 5

    # =========================
    # 2. TOTAL ITEMS (for pagination UI)
    # =========================
    total_items = frappe.db.count("Item", {"disabled": 0})
    total_pages = math.ceil(total_items / page_length)

    # =========================
    # 3. ITEMS (PAGINATED)
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
        filters={"disabled": 0},
        order_by="item_name asc",
        limit_start=(page - 1) * page_length,
        limit_page_length=page_length
    )

    # =========================
    # 4. PRICES
    # =========================
    prices = frappe.db.sql("""
        SELECT 
            item_code,
            price_list_rate,
            custom_price_before
        FROM `tabItem Price`
        WHERE selling = 1
    """, as_dict=True)

    price_map = {
        p.item_code: {
            "selling_price": p.price_list_rate,
            "custom_price_before": p.custom_price_before
        }
        for p in prices
    }

    for i in items:
        p = price_map.get(i.name)
        i.selling_price = p["selling_price"] if p else None
        i.custom_price_before = p["custom_price_before"] if p else None

    # =========================
    # 5. ITEM GROUP COUNTS
    # =========================
    item_counts = frappe.db.sql("""
        SELECT item_group, COUNT(*) as item_count
        FROM `tabItem`
        WHERE disabled = 0
        GROUP BY item_group
    """, as_dict=True)

    count_map = {d.item_group: d.item_count for d in item_counts}

    item_groups = frappe.get_all(
        "Item Group",
        fields=["name", "item_group_name", "image"],
        filters={"custom_disabled": 0},
        order_by="item_group_name asc"
    )

    for g in item_groups:
        g.item_count = count_map.get(g.name, 0)

    # =========================
    # 6. CONTEXT
    # =========================
    context.items = items
    context.item_groups = item_groups

    context.current_page = page
    context.total_pages = total_pages

    return context