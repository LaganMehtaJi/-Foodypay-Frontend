/**
 * win-spooler.js - Direct Windows Win32 Raw Print Spooler
 * Sends raw ESC/POS bytes directly to any Windows printer via winspool.drv.
 * Does not require any native C++ node-gyp compilation!
 */
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PS_RAW_PRINTER_SCRIPT = `
param (
    [string]$PrinterName,
    [string]$DataFilePath
)

Add-Type -TypeDefinition @"
using System;
using System.IO;
using System.Runtime.InteropServices;

public class RawPrinterHelper {
    [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Ansi)]
    public class DOCINFOA {
        [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
    }

    [DllImport("winspool.Drv", EntryPoint="OpenPrinterA", SetLastError=true, CharSet=CharSet.Ansi, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
    public static extern bool OpenPrinter([MarshalAs(UnmanagedType.LPStr)] string szPrinter, out IntPtr hPrinter, IntPtr pd);

    [DllImport("winspool.Drv", EntryPoint="ClosePrinter", SetLastError=true, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
    public static extern bool ClosePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint="StartDocPrinterA", SetLastError=true, CharSet=CharSet.Ansi, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, Int32 level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);

    [DllImport("winspool.Drv", EntryPoint="EndDocPrinter", SetLastError=true, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint="StartPagePrinter", SetLastError=true, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint="EndPagePrinter", SetLastError=true, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint="WritePrinter", SetLastError=true, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, Int32 dwCount, out Int32 dwWritten);

    public static bool SendFileToPrinter(string szPrinterName, string szFileName) {
        byte[] bytes = File.ReadAllBytes(szFileName);
        IntPtr hPrinter = new IntPtr(0);
        DOCINFOA di = new DOCINFOA();
        di.pDocName = "FoodyPay Receipt";
        di.pDataType = "RAW";

        if (OpenPrinter(szPrinterName.Normalize(), out hPrinter, IntPtr.Zero)) {
            if (StartDocPrinter(hPrinter, 1, di)) {
                if (StartPagePrinter(hPrinter)) {
                    IntPtr pUnmanagedBytes = Marshal.AllocCoTaskMem(bytes.Length);
                    Marshal.Copy(bytes, 0, pUnmanagedBytes, bytes.Length);
                    int written = 0;
                    bool success = WritePrinter(hPrinter, pUnmanagedBytes, bytes.Length, out written);
                    Marshal.FreeCoTaskMem(pUnmanagedBytes);
                    EndPagePrinter(hPrinter);
                    EndDocPrinter(hPrinter);
                    ClosePrinter(hPrinter);
                    return success;
                }
                EndDocPrinter(hPrinter);
            }
            ClosePrinter(hPrinter);
        }
        return false;
    }
}
"@

if ([string]::IsNullOrWhiteSpace($PrinterName) -or -not (Test-Path $DataFilePath)) {
    Write-Error "Invalid printer name or file path"
    exit 1
}

$result = [RawPrinterHelper]::SendFileToPrinter($PrinterName, $DataFilePath)
if ($result) {
    Write-Output "SUCCESS"
    exit 0
} else {
    Write-Error "Failed to write raw data to printer '$PrinterName'"
    exit 2
}
`;

// Save the PowerShell script once to disk for fast repeated calls
const psScriptPath = path.join(__dirname, 'raw-print.ps1');
try {
  fs.writeFileSync(psScriptPath, PS_RAW_PRINTER_SCRIPT, 'utf8');
} catch (e) {
  console.warn('Could not write raw-print.ps1:', e);
}

/**
 * Sends a raw Buffer or String to a Windows printer using Win32 RAW spooler.
 */
function printRawToWindowsPrinter(printerName, bufferOrString) {
  return new Promise((resolve, reject) => {
    if (!printerName) return reject(new Error('Printer name is required'));

    const buffer = Buffer.isBuffer(bufferOrString)
      ? bufferOrString
      : Buffer.from(bufferOrString, 'utf8');

    // Create a temporary file
    const tempFile = path.join(os.tmpdir(), `fp_print_${Date.now()}_${Math.random().toString(36).slice(2)}.bin`);
    fs.writeFile(tempFile, buffer, err => {
      if (err) return reject(err);

      const args = [
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-File', psScriptPath,
        '-PrinterName', printerName,
        '-DataFilePath', tempFile
      ];

      execFile('powershell.exe', args, { windowsHide: true, timeout: 15000 }, (error, stdout, stderr) => {
        // Clean up temp file
        fs.unlink(tempFile, () => {});

        if (error) {
          return reject(new Error(stderr || stdout || error.message));
        }

        if (stdout.includes('SUCCESS')) {
          resolve({ ok: true, printer: printerName, bytes: buffer.length });
        } else {
          reject(new Error(stderr || stdout || 'Print spooler failed'));
        }
      });
    });
  });
}

/**
 * Scans all Windows printers using PowerShell Get-Printer.
 */
function scanWindowsPrinters() {
  return new Promise((resolve, reject) => {
    const psCmd = `Get-Printer | Select-Object Name, DriverName, PortName, PrinterStatus, Default | ConvertTo-Json -Compress`;
    execFile('powershell.exe', ['-NoProfile', '-Command', psCmd], { windowsHide: true, timeout: 10000 }, (err, stdout, stderr) => {
      if (err) {
        console.warn('PowerShell Get-Printer error, trying wmic fallback:', err);
        return scanWindowsPrintersWmic().then(resolve).catch(reject);
      }
      try {
        const text = stdout.trim();
        if (!text) return resolve([]);
        const parsed = JSON.parse(text);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        const printers = list.map(p => ({
          name: p.Name || '',
          driver: p.DriverName || '',
          port: p.PortName || '',
          status: p.PrinterStatus || 'Normal',
          isDefault: !!p.Default
        })).filter(p => p.name);
        resolve(printers);
      } catch (e) {
        scanWindowsPrintersWmic().then(resolve).catch(reject);
      }
    });
  });
}

/**
 * Fallback printer scanner using WMIC
 */
function scanWindowsPrintersWmic() {
  return new Promise((resolve, reject) => {
    execFile('wmic', ['printer', 'get', 'Name,Default,PortName', '/format:csv'], { windowsHide: true, timeout: 10000 }, (err, stdout) => {
      if (err) return resolve([]);
      try {
        const lines = stdout.split(/\r?\n/).filter(l => l.trim().length > 0);
        const printers = [];
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',');
          if (parts.length >= 3) {
            const isDef = parts[1] && parts[1].toLowerCase().includes('true');
            const name = parts[2] ? parts[2].trim() : '';
            if (name && name !== 'Name') {
              printers.push({ name, isDefault: isDef, status: 'Normal' });
            }
          }
        }
        resolve(printers);
      } catch (e) {
        resolve([]);
      }
    });
  });
}

module.exports = {
  printRawToWindowsPrinter,
  scanWindowsPrinters
};
