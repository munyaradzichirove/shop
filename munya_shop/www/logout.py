import frappe

@frappe.whitelist(allow_guest=True)
def logout_user():
    print("logging user out")
    frappe.local.login_manager.logout()
    return {"status": "ok"}