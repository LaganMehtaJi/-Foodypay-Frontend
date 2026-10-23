const BRIDGE_URL = 'http://127.0.0.1:19999';

const bridgeStatusEl = document.getElementById('bridgeStatus');
const kotSelect = document.getElementById('kotPrinterSelect');
const billSelect = document.getElementById('billPrinterSelect');
const saveBtn = document.getElementById('savePrintersBtn');
const testKotBtn = document.getElementById('testKotBtn');
const testBillBtn = document.getElementById('testBillBtn');
const statusMsg = document.getElementById('statusMsg');

function showMsg(text, isError = false) {
    statusMsg.textContent = text;
    statusMsg.className = 'msg ' + (isError ? 'error' : 'success');
    setTimeout(() => { statusMsg.className = 'msg'; }, 4000);
}

async function checkBridgeAndLoadPrinters() {
    try {
        const res = await fetch(`${BRIDGE_URL}/status`, { cache: 'no-store' });
        if (res.ok) {
            bridgeStatusEl.innerHTML = '<span class="dot green"></span> Connected';
            bridgeStatusEl.className = 'badge green';
        } else {
            throw new Error('Bridge unreachable');
        }

        // Fetch printers
        const pRes = await fetch(`${BRIDGE_URL}/printers`, { cache: 'no-store' });
        const pData = await pRes.json();
        const printers = pData.printers || [];

        // Load saved printer preferences from storage
        chrome.storage.local.get(['kotPrinter', 'billPrinter'], (stored) => {
            populateSelect(kotSelect, printers, stored.kotPrinter);
            populateSelect(billSelect, printers, stored.billPrinter);
        });

    } catch (err) {
        bridgeStatusEl.innerHTML = '<span class="dot red"></span> Offline (Start service.bat)';
        bridgeStatusEl.className = 'badge red';
        kotSelect.innerHTML = '<option value="">Bridge Offline - check start_service.bat</option>';
        billSelect.innerHTML = '<option value="">Bridge Offline - check start_service.bat</option>';
    }
}

function populateSelect(selectEl, printers, selectedValue) {
    selectEl.innerHTML = '';
    if (!printers.length) {
        selectEl.innerHTML = '<option value="">No printers found</option>';
        return;
    }

    printers.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.name;
        opt.textContent = p.name + (p.isDefault ? ' (Default)' : '');
        if (selectedValue === p.name || (!selectedValue && p.isDefault)) {
            opt.selected = true;
        }
        selectEl.appendChild(opt);
    });
}

saveBtn.addEventListener('click', () => {
    const kotPrinter = kotSelect.value;
    const billPrinter = billSelect.value;

    chrome.storage.local.set({ kotPrinter, billPrinter }, () => {
        showMsg('Printers configured successfully!');
    });
});

testKotBtn.addEventListener('click', async () => {
    const printer = kotSelect.value;
    if (!printer) return showMsg('Please select a KOT printer first', true);

    showMsg('Sending test KOT...');
    try {
        const sampleText = [
            '========================================',
            '                KOT TEST                ',
            '========================================',
            'Table: Table 1 (Kitchen Test)',
            'Date: ' + new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
            '----------------------------------------',
            'Qty   Item',
            '----------------------------------------',
            '2x    Paneer Tikka (Full)',
            '1x    Dal Makhani (Special)',
            '3x    Butter Naan',
            '----------------------------------------',
            'Note: Less spicy, quick serve!',
            '========================================',
            '        Powered by FoodyPay POS         ',
            '========================================'
        ].join('\n');

        const res = await fetch(`${BRIDGE_URL}/print`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                printer: printer,
                target: 'kot',
                text: sampleText,
                width: 80,
                cut: true
            })
        });
        const data = await res.json();
        if (res.ok && data.ok) {
            showMsg('KOT Test printed successfully!');
        } else {
            showMsg('KOT print error: ' + (data.error || 'Check printer'), true);
        }
    } catch (err) {
        showMsg('Bridge error: ' + err.message, true);
    }
});

testBillBtn.addEventListener('click', async () => {
    const printer = billSelect.value;
    if (!printer) return showMsg('Please select a Bill printer first', true);

    showMsg('Sending test Bill...');
    try {
        const sampleText = [
            '========================================',
            '               SNACK RACK               ',
            '      MOMOS • CHINESE • TANDOOR         ',
            '========================================',
            'Bill #: TEST-001',
            'Date: ' + new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
            'Table: Restaurant - Table 1',
            '----------------------------------------',
            'Item                 Qty  Rate    Amount',
            '----------------------------------------',
            'Paneer Tikka           2   260    520.00',
            'Dal Makhani            1   160    160.00',
            'Butter Naan            3    35    105.00',
            '----------------------------------------',
            'Total items: 6         Subtotal: ₹785.00',
            '----------------------------------------',
            'TOTAL:                           ₹785.00',
            '----------------------------------------',
            'Paid via: Cash                  [ PAID ]',
            '========================================',
            '         Thank you! Visit again         ',
            '               ★ ★ ★                    ',
            '        Powered by FoodyPay POS         ',
            '========================================'
        ].join('\n');

        const res = await fetch(`${BRIDGE_URL}/print`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                printer: printer,
                target: 'bill',
                text: sampleText,
                width: 80,
                cut: true
            })
        });
        const data = await res.json();
        if (res.ok && data.ok) {
            showMsg('Bill Test printed successfully!');
        } else {
            showMsg('Bill print error: ' + (data.error || 'Check printer'), true);
        }
    } catch (err) {
        showMsg('Bridge error: ' + err.message, true);
    }
});

// Run check on popup load
checkBridgeAndLoadPrinters();
