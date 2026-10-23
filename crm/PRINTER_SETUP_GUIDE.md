# 🖨️ FoodyPay POS - Dual Silent Printer Setup Guide
### (WebUSB Direct Printing & Dual Dedicated Printers - Bina Kisi Dialog Box Ke Direct Print)

Yeh setup aapko do alag-alag printers assign karne ki suvidha deta hai:
1. **🍳 KOT (Kitchen Order Ticket):** Seedha Kitchen Printer (e.g. POS-58 ya 80mm USB Thermal) par bina dialog box ke print hoga.
2. **🧾 Bill / Invoice:** Seedha Counter Printer (e.g. POS-80 USB Thermal) par bina dialog box ke print hoga.
3. Dono printers POS ke **"🖨️ Print setup"** menu se select aur test kiye ja sakte hain.

---

## 🚀 WebUSB Direct Printing (Sabse Asaan - Zero Extra Software!)

Ab aapko kisi extension ya external software ki zaroorat nahi hai. Chrome/Edge ka WebUSB API seedha aapke USB thermal printers se connect hota hai:

### Step 1: POS App Kholein
- Apne browser mein POS app open karein: [snack_rack_pos_foodypay_responsive.html](file:///c:/Users/lenovo/OneDrive/Desktop/crm/snack_rack_pos_foodypay_responsive.html) ya `http://127.0.0.1:19999/pos`.
- Top header mein **"🖨️ Print setup"** button par click karein.

### Step 2: Kitchen KOT Printer Assign Karein
1. **🍳 Kitchen (KOT) Printer** card mein **"+ Pair USB Printer"** button par click karein.
2. Browser popup aayega — apna Kitchen USB Printer select karke **Connect** karein.
3. **Populate** button par click karein (yeh automatically KOT ke recommended standard settings pre-fill kar dega).
4. **"🧪 Test Print KOT"** button dabayein — paper seedha printer se bina kisi dialog box ke bahar aayega!

### Step 3: Counter Bill Printer Assign Karein
1. **🧾 Counter (Bill) Printer** card mein **"+ Pair USB Printer"** button par click karein.
2. Apna Counter USB Printer select karke **Connect** karein.
3. **Populate** button par click karein.
4. **"🧪 Test Print Bill"** button dabayein.

### Step 4: Save Karein
- **"💾 Save Configuration"** par click karein.

---

## ⚡ Ab Buttons Kaise Kaam Karenge?
- **🍳 KOT button:** Order ke naye items seedha **Kitchen Printer** par silently print honge aur paper auto-cut ho jayega.
- **🧾 Bill / Cash / UPI / Card buttons:** Customer bill seedha **Counter Printer** par silently print hoga aur drawer open command chali jayegi.
- **⚡ KOT + Bill button:** KOT kitchen device par aur Bill counter device par ek sath bina dialog box ke print ho jayenge!
- **Fallback Safety:** Agar printer unplugged ho ya power off ho, system apne aap safe browser dialog par fallback karega taaki order print kabhi ruke na.
