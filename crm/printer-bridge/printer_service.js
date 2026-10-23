/**
 * FoodyPay POS Silent Print Bridge Service
 * Listens on http://127.0.0.1:19999
 * Provides silent printing for KOT & Bill to dedicated printers with zero dialog box.
 */

const http = require('http');
const { execFile, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const PORT = 19999;
const HELPER_SCRIPT = path.join(__dirname, 'print_helper.ps1');

// Cache list of printers
let cachedPrinters = [];
let lastPrinterFetch = 0;

function getWindowsPrinters() {
    return new Promise((resolve) => {
        // Query Win32_Printer using PowerShell
        const cmd = 'powershell -NoProfile -Command "Get-CimInstance Win32_Printer | Select-Object Name, Default | ConvertTo-Json"';
        exec(cmd, { timeout: 8000 }, (err, stdout) => {
            if (err || !stdout.trim()) {
                // Fallback simpler command
                exec('powershell -NoProfile -Command "Get-CimInstance Win32_Printer | Select-Object -ExpandProperty Name"', { timeout: 8000 }, (e2, out2) => {
                    if (e2 || !out2.trim()) {
                        resolve(cachedPrinters.length ? cachedPrinters : ['Microsoft Print to PDF']);
                        return;
                    }
                    const list = out2.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
                    cachedPrinters = list.map(name => ({ name, isDefault: false }));
                    resolve(cachedPrinters);
                });
                return;
            }

            try {
                const parsed = JSON.parse(stdout);
                const items = Array.isArray(parsed) ? parsed : [parsed];
                cachedPrinters = items.map(p => ({
                    name: p.Name,
                    isDefault: !!p.Default
                }));
                lastPrinterFetch = Date.now();
                resolve(cachedPrinters);
            } catch (parseErr) {
                resolve(cachedPrinters);
            }
        });
    });
}

function printTicket({ printerName, textContent, widthMm = 80, autoCut = true }) {
    return new Promise((resolve, reject) => {
        if (!printerName) {
            return reject(new Error('Printer name is required'));
        }

        // Sanitize text to safe ASCII (avoids thermal printer Cyrillic / garbage ROM characters)
        const sanitized = String(textContent || '')
            .replace(/[\u2500-\u257F\u2014\u2015\u2013]/g, '-')
            .replace(/[\u2550-\u256C]/g, '=')
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/\u20B9/g, 'Rs.');

        // Save text to temporary file to avoid shell escaping issues with complex characters
        const tempFile = path.join(__dirname, `ticket_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.txt`);
        fs.writeFileSync(tempFile, sanitized, 'utf8');

        const psArgs = [
            '-NoProfile',
            '-ExecutionPolicy', 'Bypass',
            '-File', HELPER_SCRIPT,
            '-PrinterName', printerName,
            '-TextFile', tempFile,
            '-WidthMm', String(widthMm || 80),
            '-AutoCut', autoCut ? 'true' : 'false'
        ];

        execFile('powershell', psArgs, { timeout: 12000 }, (err, stdout, stderr) => {
            // Clean temp file
            try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch (e) {}

            if (err) {
                console.error(`[Print Error] ${printerName}:`, stderr || err.message);
                reject(new Error(stderr || err.message));
                return;
            }

            console.log(`[Print Success] Sent to ${printerName}: ${stdout.trim()}`);
            resolve({ ok: true, printer: printerName, detail: stdout.trim() });
        });
    });
}

const server = http.createServer(async (req, res) => {
    // Enable CORS for any origin (Chrome Extension, file://, localhost, custom domain)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = new URL(req.url, 'http://127.0.0.1:19999');
    const pathname = parsedUrl.pathname;

    const HTML_FILE = fs.existsSync(path.join(__dirname, '..', 'index.html'))
        ? path.join(__dirname, '..', 'index.html')
        : path.join(__dirname, '..', 'snack_rack_pos_foodypay_responsive.html');

    if (req.method === 'GET' && (pathname === '/pos' || pathname === '/app')) {
        if (fs.existsSync(HTML_FILE)) {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            fs.createReadStream(HTML_FILE).pipe(res);
            return;
        }
    }

    if (req.method === 'GET' && (pathname === '/' || pathname === '/status' || pathname === '/health')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            ok: true,
            service: 'FoodyPay Silent Print Bridge',
            version: '1.0.0',
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        }));
        return;
    }

    if (req.method === 'GET' && pathname === '/printers') {
        try {
            const printers = await getWindowsPrinters();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                ok: true,
                printers: printers
            }));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: err.message }));
        }
        return;
    }

    if (req.method === 'POST' && pathname === '/print') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const data = JSON.parse(body || '{}');
                const textContent = data.text || data.rawText || (data.type === 'text' ? data.content : '') || data.content || '';
                const widthMm = data.width === '58mm' || data.width === 58 ? 58 : 80;
                const autoCut = data.cut !== false;
                const target = data.target || 'ticket';

                if (!printerName) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ ok: false, error: 'Target printer device name is required' }));
                    return;
                }

                if (!textContent) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ ok: false, error: 'Text content to print is required' }));
                    return;
                }

                console.log(`[Incoming Job] Type: ${target.toUpperCase()} | Target Printer: "${printerName}" | Width: ${widthMm}mm`);

                const result = await printTicket({ printerName, textContent, widthMm, autoCut });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    ok: true,
                    message: `Successfully printed to ${printerName}`,
                    target: target,
                    result: result
                }));
            } catch (err) {
                console.error('[Print Request Failed]', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: err.message }));
            }
        });
        return;
    }

    // Default 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'Endpoint not found' }));
});

server.listen(PORT, '127.0.0.1', () => {
    console.log('========================================================');
    console.log(`  FoodyPay Silent Print Bridge is running on:`);
    console.log(`  -> http://127.0.0.1:${PORT}`);
    console.log('  -> Status: Ready for silent KOT & Bill printing');
    console.log('========================================================');
    // Pre-cache printers list on startup
    getWindowsPrinters().then(printers => {
        console.log(`Found ${printers.length} installed Windows printer(s):`);
        printers.forEach(p => console.log(`  • ${p.name} ${p.isDefault ? '(Default)' : ''}`));
    });
});
