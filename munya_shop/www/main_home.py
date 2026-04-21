import frappe

def get_context(context):

    # 1. Get item counts per group
    item_counts = frappe.db.sql("""
        SELECT item_group, COUNT(*) as item_count
        FROM `tabItem`
        WHERE disabled = 0
        GROUP BY item_group
    """, as_dict=True)

    count_map = {d.item_group: d.item_count for d in item_counts}

    # 2. Get items
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
        order_by="item_name asc"
    )

    # 3. Get item groups
    item_groups = frappe.get_all(
        "Item Group",
        fields=["name", "item_group_name", "image"],
        filters={"custom_disabled": 0},
        order_by="item_group_name asc"
    )

    # 4. Get pricing data from Item Price
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

    # 5. attach item group counts
    for g in item_groups:
        g.item_count = count_map.get(g.name, 0)

    # 6. attach pricing to items
    for i in items:
        p = price_map.get(i.name)
        if p:
            i.selling_price = p["selling_price"]
            i.custom_price_before = p["custom_price_before"]
        else:
            i.selling_price = None
            i.custom_price_before = None

    context.item_groups = item_groups
    context.items = items

    return context