import React, { useState, useEffect } from 'react';
import {
  Printer,
  Plus,
  Trash2,
  RefreshCw,
  Power,
  Wifi,
  Usb,
  Globe,
  FileText,
  ChefHat,
  Coffee,
  AlertCircle,
  X
} from 'lucide-react';
import {
  getAllPrinters,
  addPrinter,
  updatePrinter,
  deletePrinter,
  togglePrinterEnabled,
  testPrintPrinter,
  printToAllPrinters,
  PRINTER_CONNECTION_TYPES,
  PRINTER_ROLES,
} from '../utils/multiPrinterService.js';

export default function MultiPrinterModal({ isOpen, onClose, onShowToast }) {
  const [printers, setPrinters] = useState(getAllPrinters);
  const [isAdding, setIsAdding] = useState(false);
  const [editingPrinterId, setEditingPrinterId] = useState(null);
  const [testingId, setTestingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    role: 'kitchen',
    connectionType: 'LAN',
    ipAddress: '192.168.1.200',
    port: '9100',
    paperWidth: '80mm',
    isDefault: false,
    enabled: true,
  });

  useEffect(() => {
    const handleUpdate = () => setPrinters(getAllPrinters());
    window.addEventListener('foodypay_printers_updated', handleUpdate);
    return () => window.removeEventListener('foodypay_printers_updated', handleUpdate);
  }, []);

  if (!isOpen) return null;

  const handleToggle = (id) => {
    togglePrinterEnabled(id);
    if (onShowToast) onShowToast('Printer status updated');
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete printer "${name}"?`)) {
      deletePrinter(id);
      if (onShowToast) onShowToast(`Printer "${name}" deleted`);
    }
  };

  const handleTestPrint = async (printer) => {
    setTestingId(printer.id);
    try {
      await testPrintPrinter(printer);
      if (onShowToast) onShowToast(`✅ Test print sent to ${printer.name}!`);
    } catch (err) {
      if (onShowToast) onShowToast(`❌ Print failed: ${err.message}`);
    } finally {
      setTestingId(null);
    }
  };

  const handleSaveNew = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingPrinterId) {
      updatePrinter(editingPrinterId, formData);
      if (onShowToast) onShowToast(`Printer "${formData.name}" updated!`);
    } else {
      addPrinter(formData);
      if (onShowToast) onShowToast(`Printer "${formData.name}" added successfully!`);
    }

    setIsAdding(false);
    setEditingPrinterId(null);
    setFormData({
      name: '',
      role: 'kitchen',
      connectionType: 'LAN',
      ipAddress: '192.168.1.200',
      port: '9100',
      paperWidth: '80mm',
      isDefault: false,
      enabled: true,
    });
  };

  const handleEditClick = (p) => {
    setFormData({
      name: p.name,
      role: p.role,
      connectionType: p.connectionType,
      ipAddress: p.ipAddress || '',
      port: p.port || '9100',
      paperWidth: p.paperWidth || '80mm',
      isDefault: p.isDefault || false,
      enabled: p.enabled !== undefined ? p.enabled : true,
    });
    setEditingPrinterId(p.id);
    setIsAdding(true);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'billing':
        return <FileText size={16} color="#2563EB" />;
      case 'kitchen':
        return <ChefHat size={16} color="#EA580C" />;
      case 'bar':
        return <Coffee size={16} color="#0D9488" />;
      default:
        return <Printer size={16} color="#64748B" />;
    }
  };

  const getConnectionIcon = (type) => {
    switch (type) {
      case 'LAN':
        return <Wifi size={14} color="#16A34A" />;
      case 'USB':
        return <Usb size={14} color="#7C3AED" />;
      default:
        return <Globe size={14} color="#64748B" />;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1.5px solid #E2E8F0',
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1.5px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FAFAFA',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Printer size={22} strokeWidth={2.4} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                Multi-Printer Management &amp; Routing
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>
                Connect Kitchen, Billing, Bar &amp; Backup printers via USB, LAN, or Network IP
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!isAdding && (
              <button
                type="button"
                onClick={() => {
                  setEditingPrinterId(null);
                  setIsAdding(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#FF5E14',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '12.5px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(255,94,20,0.25)',
                }}
              >
                <Plus size={15} />
                <span>Add Printer</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#F1F5F9',
                border: 'none',
                borderRadius: '10px',
                padding: '8px',
                cursor: 'pointer',
                color: '#475569',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* Add / Edit Form Modal Subview */}
          {isAdding ? (
            <form onSubmit={handleSaveNew} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                  {editingPrinterId ? 'Edit Printer Settings' : 'Add New Thermal Printer'}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  style={{ background: 'none', border: 'none', color: '#64748B', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                    Printer Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kitchen Printer, Billing Counter"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                    Routing Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '13px',
                      fontWeight: 600,
                      boxSizing: 'border-box',
                    }}
                  >
                    {PRINTER_ROLES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                    Connection Method
                  </label>
                  <select
                    value={formData.connectionType}
                    onChange={(e) => setFormData({ ...formData, connectionType: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '13px',
                      fontWeight: 600,
                      boxSizing: 'border-box',
                    }}
                  >
                    {PRINTER_CONNECTION_TYPES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.connectionType === 'LAN' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                      Printer IP Address &amp; Port
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="192.168.1.200"
                        value={formData.ipAddress}
                        onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                        style={{
                          flex: 3,
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: '1.5px solid #CBD5E1',
                          fontSize: '13px',
                        }}
                      />
                      <input
                        type="text"
                        placeholder="9100"
                        value={formData.port}
                        onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                        style={{
                          flex: 1,
                          padding: '8px 8px',
                          borderRadius: '10px',
                          border: '1.5px solid #CBD5E1',
                          fontSize: '13px',
                          textAlign: 'center',
                        }}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                    Paper Width
                  </label>
                  <select
                    value={formData.paperWidth}
                    onChange={(e) => setFormData({ ...formData, paperWidth: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '13px',
                      fontWeight: 600,
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="80mm">80mm (3-Inch Standard Receipt / KOT)</option>
                    <option value="58mm">58mm (2-Inch Compact Slip)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: '#FF5E14' }}
                  />
                  <span>Set as Default Printer</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: '#16A34A' }}
                  />
                  <span>Enable Printer</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    background: '#FFFFFF',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 22px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#FF5E14',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {editingPrinterId ? 'Update Printer' : 'Save Printer'}
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Printers List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {printers.map((prn) => (
                  <div
                    key={prn.id}
                    style={{
                      border: `1.5px solid ${prn.enabled ? '#E2E8F0' : '#F1F5F9'}`,
                      backgroundColor: prn.enabled ? '#FFFFFF' : '#F8FAFC',
                      borderRadius: '16px',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      opacity: prn.enabled ? 1 : 0.65,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Left: Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '12px',
                          backgroundColor: prn.enabled ? '#F8FAFC' : '#F1F5F9',
                          border: '1px solid #E2E8F0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {getRoleIcon(prn.role)}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                            {prn.name}
                          </span>
                          {prn.isDefault && (
                            <span
                              style={{
                                backgroundColor: '#EFF6FF',
                                color: '#2563EB',
                                fontSize: '10.5px',
                                fontWeight: 800,
                                padding: '1px 6px',
                                borderRadius: '6px',
                              }}
                            >
                              Default
                            </span>
                          )}
                          <span
                            style={{
                              backgroundColor: prn.enabled ? '#DCFCE7' : '#F1F5F9',
                              color: prn.enabled ? '#15803D' : '#64748B',
                              fontSize: '10.5px',
                              fontWeight: 800,
                              padding: '1px 6px',
                              borderRadius: '6px',
                            }}
                          >
                            {prn.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', fontSize: '11.5px', color: '#64748B' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {getConnectionIcon(prn.connectionType)}
                            {prn.connectionType} {prn.ipAddress ? `(${prn.ipAddress}:${prn.port})` : ''}
                          </span>
                          <span>•</span>
                          <span>Role: <strong>{PRINTER_ROLES.find((r) => r.id === prn.role)?.name || prn.role}</strong></span>
                          <span>•</span>
                          <span>Paper: <strong>{prn.paperWidth}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Test Print */}
                      <button
                        type="button"
                        disabled={!prn.enabled || testingId === prn.id}
                        onClick={() => handleTestPrint(prn)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          backgroundColor: '#F1F5F9',
                          border: '1px solid #CBD5E1',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          color: '#334155',
                          cursor: prn.enabled ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <RefreshCw size={12} className={testingId === prn.id ? 'animate-spin' : ''} />
                        <span>Test Print</span>
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => handleEditClick(prn)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '8px',
                          backgroundColor: '#F8FAFC',
                          border: '1px solid #CBD5E1',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          color: '#334155',
                          cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>

                      {/* Enable / Disable toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggle(prn.id)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '8px',
                          backgroundColor: prn.enabled ? '#FEF2F2' : '#F0FDF4',
                          border: `1px solid ${prn.enabled ? '#FCA5A5' : '#BBF7D0'}`,
                          color: prn.enabled ? '#DC2626' : '#16A34A',
                          fontSize: '11.5px',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        <Power size={13} />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDelete(prn.id, prn.name)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#EF4444',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                        title="Delete Printer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Workflow Printing Test Box */}
              <div
                style={{
                  marginTop: '22px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '16px',
                  border: '1.5px dashed #CBD5E1',
                  padding: '16px',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                  Quick Print Workflow Controls
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      printToAllPrinters('bill', {
                        id: 'DEMO-BILL',
                        table: 'Table 1',
                        type: 'Dine-In',
                        items: [{ name: 'Paneer Butter Masala', qty: 2, price: 280 }],
                        total: 560,
                      });
                      if (onShowToast) onShowToast('🧾 Dispatched to Billing Counter printer!');
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '10px',
                      backgroundColor: '#EFF6FF',
                      color: '#2563EB',
                      border: '1.5px solid #BFDBFE',
                      fontWeight: 800,
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <FileText size={14} />
                    <span>Print Bill Receipt</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      printToAllPrinters('kitchen', {
                        id: 'DEMO-KOT',
                        table: 'Table 1',
                        type: 'Dine-In',
                        items: [{ name: 'Crispy Veg Momos', qty: 1 }],
                      });
                      if (onShowToast) onShowToast('🍳 Dispatched to Kitchen KOT printer!');
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '10px',
                      backgroundColor: '#FFF7ED',
                      color: '#EA580C',
                      border: '1.5px solid #FED7AA',
                      fontWeight: 800,
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <ChefHat size={14} />
                    <span>Print Kitchen KOT</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      printToAllPrinters('all', {
                        id: 'DEMO-ALL',
                        table: 'Table 1',
                        type: 'Dine-In',
                        items: [{ name: 'Chef Special Platter', qty: 1, price: 450 }],
                        total: 450,
                      });
                      if (onShowToast) onShowToast('🖨️ Dispatched to ALL eligible printers!');
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '10px',
                      backgroundColor: '#F0FDF4',
                      color: '#16A34A',
                      border: '1.5px solid #BBF7D0',
                      fontWeight: 800,
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Printer size={14} />
                    <span>Print All Enabled Printers</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
