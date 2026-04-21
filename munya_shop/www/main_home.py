import frappe

def get_context(context):

    # 1. Get item counts per group (fast aggregation)
    item_counts = frappe.db.sql("""
        SELECT item_group, COUNT(*) as item_count
        FROM `tabItem`
        WHERE disabled = 0
        GROUP BY item_group
    """, as_dict=True)

    count_map = {d.item_group: d.item_count for d in item_counts}

    # 2. Get all items (exclude all_item_groups)
    items = frappe.get_all(
        "Item",
        fields=["name", "item_name", "item_group", "image","custom_is_trendy","custom_just_arrived"],
        filters={
            "disabled": 0,
            # "item_group": ["!=", "all_item_groups"]
        },
        order_by="item_name asc"
    )

    # 3. Get item groups (exclude all_item_groups)
    item_groups = frappe.get_all(
        "Item Group",
        fields=["name", "item_group_name", "image"],
        filters={
            "custom_disabled": 0,
            "name": ["!=", "All Item Groups"]
        },
        order_by="item_group_name asc"
    )

    # 4. attach count to each group
    for g in item_groups:
        g.item_count = count_map.get(g.name, 0)

    context.item_groups = item_groups
    context.items = items

    return context