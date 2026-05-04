from frappe.model.document import Document
from frappe.utils import flt, cint

class CartItem(Document):
    def before_save(self):
        # Ensure qty is an integer and rate is a float
        self.qty = cint(self.qty)
        self.rate = flt(self.rate)
        
        # Recalculate total amount
        self.amount = self.qty * self.rate