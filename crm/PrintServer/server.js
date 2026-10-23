const http = require('http');
const os = require('os');
const { EventEmitter } = require('events');
const printerService = require('../printerService');

class PrintServer extends EventEmitter {
  constructor(port = 19090) {
    super();
    this.port = port;
    this.server = null;
    this.isRunning = false;
    this.stats = {
      totalRequests: 0,
      totalPrints: 0,
      failedPrints: 0,
      startedAt: null
    };
  }

  getLocalIps() {
    const interfaces = os.networkInterfaces();
    const ips = [];
    for (const devName in interfaces) {
      const iface = interfaces[devName];
      for (const alias of iface) {
        if (alias.family === 'IPv4' && !alias.internal) {
          ips.push(alias.address);
        }
      }
    }
    return ips;
  }

  start() {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        this.handleRequest(req, res);
      });

      this.server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.warn(`[PrintServer] Port ${this.port} in use. Retrying with ${this.port + 1}...`);
          this.port += 1;
          this.server.close();
          this.server.listen(this.port, '0.0.0.0');
        } else {
          this.emit('error', err);
          reject(err);
        }
      });

      this.server.listen(this.port, '0.0.0.0', () => {
        this.isRunning = true;
        this.stats.startedAt = new Date();
        const ips = this.getLocalIps();
        console.log(`[PrintServer] FoodyPay in-house print server running on port ${this.port}`);
        this.emit('started', { port: this.port, ips });
        resolve({ port: this.port, ips });
      });
    });
  }

  stop() {
    return new Promise((resolve) => {
      if (this.server && this.isRunning) {
        this.server.close(() => {
          this.isRunning = false;
          this.emit('stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.setHeader('Access-Control-Private-Network', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  sendJson(res, statusCode, data) {
    this.setCorsHeaders(res);
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data, null, 2));
  }

  parseBody(req) {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
        if (body.length > 30 * 1024 * 1024) {
          reject(new Error('Payload too large'));
        }
      });
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (e) {
          resolve({ rawText: body });
        }
      });
      req.on('error', reject);
    });
  }

  async handleRequest(req, res) {
    this.stats.totalRequests++;
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname.replace(/\/$/, '') || '/';

    if (req.method === 'OPTIONS') {
      this.setCorsHeaders(res);
      res.writeHead(204);
      res.end();
      return;
    }

    try {
      // 1. Status
      if (pathname === '/' || pathname === '/api/status' || pathname === '/status') {
        const printers = await printerService.getPrinters();
        return this.sendJson(res, 200, {
          ok: true,
          success: true,
          name: 'FoodyPay In-House PrintServer',
          version: '2.0.0',
          status: 'online',
          port: this.port,
          printersCount: printers.length
        });
      }

      // 2. Printers
      if (pathname === '/api/printers' || pathname === '/printers') {
        const printers = await printerService.getPrinters();
        return this.sendJson(res, 200, {
          ok: true,
          success: true,
          count: printers.length,
          printers: printers
        });
      }

      // 3. Print (HTML / Text / Raw)
      if (pathname === '/api/print' || pathname === '/print' || pathname === '/api/print/raw' || pathname === '/print/raw') {
        if (req.method !== 'POST') return this.sendJson(res, 405, { ok: false, error: 'Method not allowed' });
        const body = await this.parseBody(req);
        const printerName = body.printer || body.printerName || '';
        const html = body.html || (body.type === 'html' ? body.content : null);
        const text = body.text || body.rawText || (body.type === 'text' ? body.content : null);
        const options = body.options || {};

        let result = null;
        if (html) {
          result = await printerService.printHtml({ html, printerName, options });
        } else if (text) {
          result = await printerService.printText({ text, printerName, options });
        } else if (body.pdf || body.type === 'pdf') {
          result = await printerService.printPdf({ pdfData: body.pdf || body.content, printerName, options });
        } else {
          return this.sendJson(res, 400, { ok: false, error: 'No printable content provided' });
        }

        this.stats.totalPrints++;
        return this.sendJson(res, 200, { ok: true, success: true, ...result });
      }

      return this.sendJson(res, 404, { ok: false, error: 'Endpoint not found' });
    } catch (err) {
      this.stats.failedPrints++;
      return this.sendJson(res, 500, { ok: false, error: err.message });
    }
  }
}

module.exports = PrintServer;