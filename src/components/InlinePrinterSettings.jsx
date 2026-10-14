import React, { useState, useEffect } from 'react';
import {
  Printer,
  Plus,
  Trash2,
  Check,
  RefreshCw,
  Edit3,
  Wifi,
  Usb,
  Globe,
  X
} from 'lucide-react';
import {
  getAllPrinters,
  saveAllPrinters,
  addPrinter,
  updatePrinter,
  deletePrinter,
  togglePrinterEnabled,
  testPrintPrinter,
  getActiveBillPrinter,
  getActiveKotPrinter,
} from '../utils/multiPrinterService.js';
import {
  getPrinterSettings,
  savePrinterSettings,
  executeDualPrint,
  printThermalReceipt,
  printThermalKot,
} from '../utils/thermalPrinter.js';

export default function InlinePrinterSettings({ onShowToast, storeControls = {} }) {
  const [printers, setPrinters] = useState(() => getAllPrinters());
  const [printerConfig, setPrinterConfig] = useState(() => getPrinterSettings());
  const [isAdding, setIsAdding] = useState(false);
  const [editingPrinterId, setEditingPrinterId] = useState(null);
  const [testingId, setTestingId] = useState(null);
  const [isDualTesting, setIsDualTesting] = useState(false);

  // Form State for Add / Edit inline
  const [formData, setFormData] = useState({
    name: '',
    role: 'kitchen',
    connectionType: 'LAN',
    ipAddress: '192.168.1.200',
    port: '9100',
    subnetMask: '255.255.255.0',
    gateway: '192.168.1.1',
    paperWidth: '80mm',
    isDefault: false,
    enabled: true,
  });

  const refreshPrinters = () => {
    setPrinters(getAllPrinters());
    setPrinterConfig(getPrinterSettings());
  };

  useEffect(() => {
    window.addEventListener('foodypay_printers_updated', refreshPrinters);
    window.addEventListener('foodypay_printer_updated', refreshPrinters);
    return () => {
      window.removeEventListener('foodypay_printers_updated', refreshPrinters);
      window.removeEventListener('foodypay_printer_updated', refreshPrinters);
    };
  }, []);

  const activeBill = getActiveBillPrinter();
  const activeKot = getActiveKotPrinter();

  // Handle switching Bill Printer
  const handleSelectBillPrinter = (printerId) => {
    const updated = printers.map((p) => {
      if (p.id === printerId) {
        return { ...p, role: p.role === 'kitchen' ? 'all' : 'billing', isDefault: true, enabled: true };
      }
      if (p.isDefault && p.id !== printerId) {
        return { ...p, isDefault: false };
      }
      return p;
    });
    saveAllPrinters(updated);
    setPrinters(updated);

    // Sync to thermalPrinter config printer1
    const selectedPrn = updated.find((p) => p.id === printerId);
    if (selectedPrn) {
      const newConfig = {
        ...printerConfig,
        printer1: {
          ...printerConfig.printer1,
          name: selectedPrn.name,
          type: selectedPrn.connectionType === 'LAN' ? 'network' : 'browser',
          ip: selectedPrn.ipAddress || '',
          port: Number(selectedPrn.port) || 9100,
          paperWidth: selectedPrn.paperWidth || '80mm',
          isDefault: true,
        },
      };
      savePrinterSettings(newConfig);
      setPrinterConfig(newConfig);
    }
    if (onShowToast) onShowToast(`✓ Selected "${selectedPrn?.name || printerId}" as Default Bill Printer`);
  };

  // Handle switching KOT Printer
  const handleSelectKotPrinter = (printerId) => {
    const updated = printers.map((p) => {
      if (p.id === printerId) {
        return { ...p, role: p.role === 'billing' ? 'all' : 'kitchen', enabled: true };
      }
      return p;
    });
    saveAllPrinters(updated);
    setPrinters(updated);

    // Sync to thermalPrinter config printer2
    const selectedPrn = updated.find((p) => p.id === printerId);
    if (selectedPrn) {
      const newConfig = {
        ...printerConfig,
        printer2: {
          ...printerConfig.printer2,
          name: selectedPrn.name,
          type: selectedPrn.connectionType === 'LAN' ? 'network' : 'browser',
          ip: selectedPrn.ipAddress || '',
          port: Number(selectedPrn.port) || 9100,
          subnetMask: selectedPrn.subnetMask || '255.255.255.0',
          gateway: selectedPrn.gateway || '192.168.1.1',
          paperWidth: selectedPrn.paperWidth || '80mm',
          isDefault: false,
        },
      };
      savePrinterSettings(newConfig);
      setPrinterConfig(newConfig);
    }
    if (onShowToast) onShowToast(`✓ Selected "${selectedPrn?.name || printerId}" as Default KOT Printer`);
  };

  const handleToggleDualPrint = (checked) => {
    const updated = { ...printerConfig, dualPrintEnabled: checked };
    setPrinterConfig(updated);
    savePrinterSettings(updated);
    if (onShowToast) {
      onShowToast(checked ? '✓ Dual Print Mode Activated! (2 Separate Printers)' : 'Single Printer Mode Selected');
    }
  };

  const handleToggleDirectPrint = (checked) => {
    const updated = { ...printerConfig, directPrintEnabled: checked };
    setPrinterConfig(updated);
    savePrinterSettings(updated);
    if (onShowToast) {
      onShowToast(checked ? 'Direct Silent Print Enabled' : 'Browser Print Dialog Enabled');
    }
  };

  const handleTestPrint = async (printer) => {
    setTestingId(printer.id);
    try {
      await testPrintPrinter(printer);
      if (onShowToast) onShowToast(`✅ Test print sent to "${printer.name}"!`);
    } catch (err) {
      if (onShowToast) onShowToast(`❌ Print failed: ${err.message}`);
    } finally {
      setTestingId(null);
    }
  };

  const handleTestDualPrint = async () => {
    setIsDualTesting(true);
    const sampleOrder = {
      id: '#FP-TEST-01',
      table: 'Table 1',
      type: 'Dine-In',
      total: 350,
      createdAt: new Date().toISOString(),
      items: [
        { name: 'Paneer Butter Masala', qty: 1, price: 280 },
        { name: 'Butter Naan', qty: 2, price: 35 },
      ],
    };
    try {
      await executeDualPrint(sampleOrder, storeControls, 'both');
      if (onShowToast) onShowToast('✓ 2 Separate Prints Dispatched (1 Bill + 1 KOT)!');
    } catch (err) {
      if (onShowToast) onShowToast(`Test print failed: ${err.message}`);
    } finally {
      setIsDualTesting(false);
    }
  };

  const handleEditClick = (printer) => {
    setIsAdding(true);
    setEditingPrinterId(printer.id);
    setFormData({
      name: printer.name || '',
      role: printer.role || 'kitchen',
      connectionType: printer.connectionType || 'LAN',
      ipAddress: printer.ipAddress || '',
      port: printer.port || '9100',
      subnetMask: printer.subnetMask || '255.255.255.0',
      gateway: printer.gateway || '192.168.1.1',
      paperWidth: printer.paperWidth || '80mm',
      isDefault: Boolean(printer.isDefault),
      enabled: printer.enabled !== false,
    });
  };

  const handleCancelForm = () => {
    setIsAdding(false);
    setEditingPrinterId(null);
    setFormData({
      name: '',
      role: 'kitchen',
      connectionType: 'LAN',
      ipAddress: '192.168.1.200',
      port: '9100',
      subnetMask: '255.255.255.0',
      gateway: '192.168.1.1',
      paperWidth: '80mm',
      isDefault: false,
      enabled: true,
    });
  };

  const handleSaveForm = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingPrinterId) {
      updatePrinter(editingPrinterId, formData);
      if (onShowToast) onShowToast(`✓ Printer "${formData.name}" updated!`);
    } else {
      addPrinter(formData);
      if (onShowToast) onShowToast(`✓ New Printer "${formData.name}" added successfully!`);
    }

    handleCancelForm();
    refreshPrinters();
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete printer "${name}"?`)) {
      deletePrinter(id);
      refreshPrinters();
      if (onShowToast) onShowToast(`Printer "${name}" deleted`);
    }
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1.5px solid #E2E8F0',
        padding: '24px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        marginTop: '20px',
      }}
    >
      {/* 1. Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: '#EFF6FF',
              color: '#1D4ED8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Printer size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#0F172A' }}>
              Thermal Printers &amp; 2-Printer Routing Settings
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#64748B' }}>
              Configure 2 separate printers: <strong>Bill Printer</strong> (Counter Receipts) &amp; <strong>KOT Printer</strong> (Kitchen Orders). Prints nikalte waqt dono alag-alag printers par automatically route honge.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              padding: '5px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 800,
              backgroundColor: printerConfig.dualPrintEnabled ? '#DCFCE7' : '#F1F5F9',
              color: printerConfig.dualPrintEnabled ? '#15803D' : '#64748B',
              border: `1px solid ${printerConfig.dualPrintEnabled ? '#86EFAC' : '#CBD5E1'}`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: printerConfig.dualPrintEnabled ? '#16A34A' : '#94A3B8',
              }}
            />
            {printerConfig.dualPrintEnabled ? '2 Printers Active (Dual Routing)' : 'Single Printer Mode'}
          </span>
        </div>
      </div>

      {/* 2. Routing Assignment Cards: Bill Printer & KOT Printer Selectors */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        
        {/* BILL PRINTER CARD */}
        <div
          style={{
            background: '#F8FAFC',
            border: '2px solid #2563EB',
            borderRadius: '14px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🧾</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#0F172A' }}>Bill Printer (Customer Receipt)</div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Used by "Print Bill" button in Counter POS</div>
              </div>
            </div>
            <span style={{ background: '#DBEAFE', color: '#1E40AF', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 900 }}>
              BILL COUNTER
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
              Assigned Printer Device:
            </label>
            <select
              value={activeBill?.id || ''}
              onChange={(e) => handleSelectBillPrinter(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1.5px solid #CBD5E1',
                fontSize: '13px',
                fontWeight: 700,
                color: '#0F172A',
                backgroundColor: '#FFFFFF',
              }}
            >
              {printers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.connectionType} {p.connectionType === 'LAN' ? p.ipAddress : ''} - {p.paperWidth})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '12px' }}>
            <span style={{ color: '#64748B' }}>
              Width: <strong>{activeBill?.paperWidth || '80mm'}</strong> • Conn: <strong>{activeBill?.connectionType || 'Browser'}</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                if (activeBill) handleTestPrint(activeBill);
                else printThermalReceipt({ id: 'TEST-01', table: 'Table 1', items: [{ name: 'Test Bill', qty: 1, price: 100 }], total: 100 }, storeControls);
              }}
              disabled={testingId === activeBill?.id}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #93C5FD',
                background: '#EFF6FF',
                color: '#1D4ED8',
                fontSize: '11.5px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {testingId === activeBill?.id ? 'Testing...' : 'Test Bill Print'}
            </button>
          </div>
        </div>

        {/* KOT PRINTER CARD */}
        <div
          style={{
            background: '#FFF7ED',
            border: '2px solid #FF5E14',
            borderRadius: '14px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🍳</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#0F172A' }}>KOT Printer (Kitchen Orders)</div>
                <div style={{ fontSize: '11px', color: '#9A3412' }}>Used by "Print in KOT" button in Counter POS</div>
              </div>
            </div>
            <span style={{ background: '#FFEDD5', color: '#C2410C', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 900 }}>
              KITCHEN LAN
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#9A3412', marginBottom: '4px' }}>
              Assigned Printer Device:
            </label>
            <select
              value={activeKot?.id || ''}
              onChange={(e) => handleSelectKotPrinter(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1.5px solid #FDBA74',
                fontSize: '13px',
                fontWeight: 700,
                color: '#0F172A',
                backgroundColor: '#FFFFFF',
              }}
            >
              {printers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.connectionType} {p.connectionType === 'LAN' ? p.ipAddress : ''} - {p.paperWidth})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '12px' }}>
            <span style={{ color: '#9A3412' }}>
              Width: <strong>{activeKot?.paperWidth || '80mm'}</strong> • Conn: <strong>{activeKot?.connectionType === 'LAN' ? `IP ${activeKot?.ipAddress || '192.168.1.200'}` : activeKot?.connectionType}</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                if (activeKot) handleTestPrint(activeKot);
                else printThermalKot({ id: 'TEST-01', table: 'Table 1', items: [{ name: 'Test KOT Item', qty: 2 }] }, storeControls);
              }}
              disabled={testingId === activeKot?.id}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #FDBA74',
                background: '#FFEDD5',
                color: '#C2410C',
                fontSize: '11.5px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {testingId === activeKot?.id ? 'Testing...' : 'Test KOT Print'}
            </button>
          </div>
        </div>

      </div>

      {/* 3. Master Switches & 1-Click Dual Print Test */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
        <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>Dual Print Mode (2 Prints at Once)</div>
            <div style={{ fontSize: '11.5px', color: '#64748B' }}>1 click pe dono alag printers me alag print jaye</div>
          </div>
          <input
            type="checkbox"
            checked={Boolean(printerConfig.dualPrintEnabled)}
            onChange={(e) => handleToggleDualPrint(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#2563EB' }}
          />
        </div>

        <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>Direct Silent Print</div>
            <div style={{ fontSize: '11.5px', color: '#64748B' }}>Instant background print without dialog lag</div>
          </div>
          <input
            type="checkbox"
            checked={Boolean(printerConfig.directPrintEnabled)}
            onChange={(e) => handleToggleDirectPrint(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#2563EB' }}
          />
        </div>

        <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>⚡ Test Dual Print Run</div>
            <div style={{ fontSize: '11.5px', color: '#64748B' }}>Bill to Printer 1 + KOT to Printer 2</div>
          </div>
          <button
            type="button"
            onClick={handleTestDualPrint}
            disabled={isDualTesting}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: '#0F172A',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isDualTesting ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Printer size={14} />}
            <span>Test 2 Prints</span>
          </button>
        </div>
      </div>

      {/* 4. Configured Printers List */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
            All Configured Thermal Printers ({printers.length})
          </h4>
          {!isAdding && (
            <button
              type="button"
              onClick={() => {
                setIsAdding(true);
                setEditingPrinterId(null);
                setFormData({
                  name: '',
                  role: 'kitchen',
                  connectionType: 'LAN',
                  ipAddress: '192.168.1.200',
                  port: '9100',
                  subnetMask: '255.255.255.0',
                  gateway: '192.168.1.1',
                  paperWidth: '80mm',
                  isDefault: false,
                  enabled: true,
                });
              }}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                backgroundColor: '#FF5E14',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 800,
                fontSize: '12.5px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Plus size={15} /> Add New Printer
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {printers.map((prn) => {
            const isBillTarget = activeBill?.id === prn.id;
            const isKotTarget = activeKot?.id === prn.id;

            return (
              <div
                key={prn.id}
                style={{
                  background: prn.enabled ? '#FFFFFF' : '#F8FAFC',
                  border: isBillTarget || isKotTarget ? '1.5px solid #3B82F6' : '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      backgroundColor: prn.connectionType === 'LAN' ? '#FFF7ED' : prn.connectionType === 'USB' ? '#F0FDF4' : '#EFF6FF',
                      color: prn.connectionType === 'LAN' ? '#EA580C' : prn.connectionType === 'USB' ? '#16A34A' : '#2563EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {prn.connectionType === 'LAN' ? <Wifi size={18} /> : prn.connectionType === 'USB' ? <Usb size={18} /> : <Globe size={18} />}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '14px', color: '#0F172A' }}>{prn.name}</strong>
                      {isBillTarget && (
                        <span style={{ background: '#DBEAFE', color: '#1E40AF', padding: '1px 6px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 800 }}>
                          ★ BILL PRINTER
                        </span>
                      )}
                      {isKotTarget && (
                        <span style={{ background: '#FFEDD5', color: '#C2410C', padding: '1px 6px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 800 }}>
                          ★ KOT PRINTER
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                      Type: <strong>{prn.connectionType}</strong> {prn.connectionType === 'LAN' ? `(${prn.ipAddress}:${prn.port})` : ''} • Paper: <strong>{prn.paperWidth || '80mm'}</strong> • Role: <strong>{prn.role}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const updatedPrn = togglePrinterEnabled(prn.id);
                      refreshPrinters();
                      if (onShowToast) {
                        onShowToast(updatedPrn.enabled ? `✓ "${prn.name}" is now ACTIVE` : `⚪ "${prn.name}" is now INACTIVE`);
                      }
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: prn.enabled !== false ? '1.5px solid #16A34A' : '1.5px solid #CBD5E1',
                      background: prn.enabled !== false ? '#DCFCE7' : '#F1F5F9',
                      color: prn.enabled !== false ? '#15803D' : '#64748B',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                    title={prn.enabled !== false ? "Click to Deactivate printer" : "Click to Activate printer"}
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: prn.enabled !== false ? '#16A34A' : '#94A3B8' }} />
                    {prn.enabled !== false ? 'ACTIVE' : 'INACTIVE'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTestPrint(prn)}
                    disabled={testingId === prn.id}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      background: '#F8FAFC',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {testingId === prn.id ? 'Testing...' : 'Test Print'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleEditClick(prn)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#1D4ED8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Edit3 size={13} /> Edit
                  </button>

                  {printers.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleDelete(prn.id, prn.name)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #FCA5A5',
                        background: '#FEF2F2',
                        color: '#DC2626',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                      title="Delete Printer"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Inline Add / Edit Printer Form (NO MODAL POPUP!) */}
      {isAdding && (
        <div
          style={{
            background: '#F8FAFC',
            border: '2px dashed #94A3B8',
            borderRadius: '14px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: '#0F172A' }}>
              {editingPrinterId ? '✏️ Edit Printer Details' : '➕ Add New Thermal Printer'}
            </h4>
            <button
              type="button"
              onClick={handleCancelForm}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: '#64748B',
              }}
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSaveForm} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                Printer Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Counter 80mm or Kitchen LAN"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                Primary Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', backgroundColor: '#FFFFFF' }}
              >
                <option value="billing">Customer Bill / Invoices (Receipts)</option>
                <option value="kitchen">Kitchen Printer (Food KOT)</option>
                <option value="bar">Bar Printer (Beverages / Drinks)</option>
                <option value="all">Universal / All Workflows</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                Connection Type
              </label>
              <select
                value={formData.connectionType}
                onChange={(e) => setFormData({ ...formData, connectionType: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', backgroundColor: '#FFFFFF' }}
              >
                <option value="BROWSER">Browser Spooler / System Dialog</option>
                <option value="LAN">LAN / Ethernet / WiFi Network IP</option>
                <option value="USB">USB Thermal (ESC/POS Direct)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                Paper Width
              </label>
              <select
                value={formData.paperWidth}
                onChange={(e) => setFormData({ ...formData, paperWidth: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', backgroundColor: '#FFFFFF' }}
              >
                <option value="80mm">80mm (3-inch Standard POS Receipt)</option>
                <option value="58mm">58mm (2-inch Compact Thermal Slip)</option>
              </select>
            </div>

            {formData.connectionType === 'LAN' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Network IP Address
                  </label>
                  <input
                    type="text"
                    placeholder="192.168.1.200"
                    value={formData.ipAddress}
                    onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Port (Default 9100)
                  </label>
                  <input
                    type="text"
                    placeholder="9100"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', fontFamily: 'monospace' }}
                  />
                </div>
              </>
            )}

            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '8px', background: '#FFFFFF', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', marginTop: '4px' }}>
              <input
                type="checkbox"
                id="printer-active-toggle-input"
                checked={formData.enabled !== false}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#16A34A' }}
              />
              <label htmlFor="printer-active-toggle-input" style={{ fontSize: '13px', fontWeight: 800, color: formData.enabled !== false ? '#15803D' : '#64748B', cursor: 'pointer' }}>
                {formData.enabled !== false ? '✓ Printer is ACTIVE (Enabled for printing)' : '✕ Printer is INACTIVE (Disabled)'}
              </label>
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={handleCancelForm}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#1D4ED8',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Check size={16} /> Save Printer Details
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
