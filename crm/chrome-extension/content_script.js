/**
 * FoodyPay POS Silent Printer - Content Script
 * Injected into the POS web application to bridge messages between webpage and extension/print bridge.
 */

// Announce extension presence on HTML root attribute
document.documentElement.setAttribute('data-foodypay-extension', '1.0.0');

// Inject script to set window flag accessible to web page scripts
try {
    const s = document.createElement('script');
    s.textContent = `window.__FOODYPAY_EXTENSION__ = { version: "1.0.0", active: true };`;
    (document.head || document.documentElement).appendChild(s);
    s.remove();
} catch (e) {}

const BRIDGE_URL = 'http://127.0.0.1:19999';

// Listen to messages from POS webpage
window.addEventListener('message', async (event) => {
    // Only accept messages with source window and our prefix
    if (event.source !== window || !event.data || !event.data.type || !event.data.type.startsWith('FOODYPAY_')) {
        return;
    }

    const { type, payload } = event.data;

    // Ping check
    if (type === 'FOODYPAY_PING') {
        // Also check if local bridge is reachable
        let bridgeOnline = false;
        try {
            const res = await fetch(`${BRIDGE_URL}/status`, { cache: 'no-store' });
            if (res.ok) bridgeOnline = true;
        } catch (err) {
            bridgeOnline = false;
        }

        window.postMessage({
            type: 'FOODYPAY_PONG',
            extension: true,
            version: '1.0.0',
            bridgeOnline: bridgeOnline
        }, '*');
        return;
    }

    // Get list of printers
    if (type === 'FOODYPAY_GET_PRINTERS') {
        try {
            const res = await fetch(`${BRIDGE_URL}/printers`, { cache: 'no-store' });
            const data = await res.json();
            window.postMessage({
                type: 'FOODYPAY_PRINTERS_LIST',
                ok: true,
                printers: data.printers || []
            }, '*');
        } catch (err) {
            window.postMessage({
                type: 'FOODYPAY_PRINTERS_LIST',
                ok: false,
                error: err.message
            }, '*');
        }
        return;
    }

    // Silent print command
    if (type === 'FOODYPAY_PRINT') {
        try {
            const res = await fetch(`${BRIDGE_URL}/print`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload || {})
            });
            const data = await res.json();
            window.postMessage({
                type: 'FOODYPAY_PRINT_RESULT',
                ok: res.ok && data.ok,
                target: payload ? payload.target : null,
                printer: payload ? payload.printer : null,
                message: data.message || (res.ok ? 'Print sent' : 'Print failed'),
                error: data.error
            }, '*');
        } catch (err) {
            window.postMessage({
                type: 'FOODYPAY_PRINT_RESULT',
                ok: false,
                target: payload ? payload.target : null,
                error: 'Could not connect to FoodyPay Printer Bridge (127.0.0.1:19999). Is start_service.bat running?'
            }, '*');
        }
        return;
    }
});
