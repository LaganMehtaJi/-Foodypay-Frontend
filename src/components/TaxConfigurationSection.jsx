import React, { useState, useEffect } from 'react';
import {
  Percent,
  Check,
  Plus,
  Trash2,
  Sparkles,
  Save,
  Calculator,
  ShieldCheck,
  Info
} from 'lucide-react';
import {
  TAX_MODES,
  TAX_PRESETS,
  getMerchantTaxConfig,
  saveMerchantTaxConfig,
  calculateTax,
} from '../utils/taxEngine.js';

export default function TaxConfigurationSection({ onSaved, onClose, isModal = false }) {
  const [taxConfig, setTaxConfig] = useState(getMerchantTaxConfig);
  const [simPrice, setSimPrice] = useState(100);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state if external changes happen
  useEffect(() => {
    const handleUpdate = (e) => {
      if (e.detail) setTaxConfig(e.detail);
    };
    window.addEventListener('foodypay_tax_config_updated', handleUpdate);
    return () => window.removeEventListener('foodypay_tax_config_updated', handleUpdate);
  }, []);

  // Compute live preview based on current state & test amount
  const livePreview = calculateTax(simPrice, taxConfig);

  const handleApplyPreset = (preset) => {
    setTaxConfig((prev) => ({
      ...prev,
      components: preset.components.map((c) => ({ ...c })),
    }));
  };

  const handleAddComponent = () => {
    const id = `tax_${Date.now()}`;
    const newComp = { id, name: 'Custom Tax', rate: 2.5, enabled: true };
    setTaxConfig((prev) => ({
      ...prev,
      components: [...prev.components, newComp],
    }));
  };

  const handleUpdateComponent = (index, field, val) => {
    setTaxConfig((prev) => {
      const next = [...prev.components];
      next[index] = { ...next[index], [field]: val };
      return { ...prev, components: next };
    });
  };

  const handleDeleteComponent = (index) => {
    setTaxConfig((prev) => {
      const next = prev.components.filter((_, i) => i !== index);
      return { ...prev, components: next };
    });
  };

  const handleSave = () => {
    saveMerchantTaxConfig(taxConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
    if (onSaved) onSaved(taxConfig);
  };

  const totalRate = (taxConfig.components || [])
    .filter((c) => c.enabled)
    .reduce((sum, c) => sum + (Number(c.rate) || 0), 0);

  const containerStyle = isModal
    ? {
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }
    : {
        width: '100%',
        margin: '0 auto',
      };

  return (
    <div style={containerStyle}>
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          boxShadow: '0 20px 45px rgba(0,0,0,0.12)',
          border: '1.5px solid #E2E8F0',
          width: '100%',
          maxWidth: isModal ? '720px' : '100%',
          maxHeight: isModal ? '90vh' : 'none',
          overflowY: 'auto',
          padding: '24px',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1.5px solid #F1F5F9',
            paddingBottom: '16px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: '#FFF7ED',
                color: '#EA580C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Percent size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                Product Catalog Tax &amp; GST Configuration
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>
                Pre-Tax (Tax-Inclusive) &amp; Post-Tax (Tax-Exclusive) with custom component distribution
              </p>
            </div>
          </div>

          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#F1F5F9',
                border: 'none',
                borderRadius: '10px',
                padding: '6px 12px',
                fontSize: '12.5px',
                fontWeight: 700,
                color: '#475569',
                cursor: 'pointer',
              }}
            >
              ✕ Close
            </button>
          )}
        </div>

        {/* Master Enable Toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: taxConfig.enabled ? '#F0FDF4' : '#F8FAFC',
            border: `1.5px solid ${taxConfig.enabled ? '#BBF7D0' : '#E2E8F0'}`,
            borderRadius: '14px',
            padding: '14px 18px',
            marginBottom: '20px',
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: '14px', color: '#0F172A' }}>
              Enable Restaurant Taxes / GST System
            </div>
            <div style={{ fontSize: '12px', color: '#64748B' }}>
              When enabled, taxes are automatically broken down on catalog, bills, KOT, and invoices.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTaxConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}
            style={{
              padding: '8px 18px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: taxConfig.enabled ? '#16A34A' : '#94A3B8',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {taxConfig.enabled ? 'ACTIVE (ON)' : 'DISABLED (OFF)'}
          </button>
        </div>

        {/* Pricing Mode Selector: PRE-TAX vs POST-TAX */}
        <div style={{ marginBottom: '22px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>
            Choose Pricing Tax Mode
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            {/* Pre-Tax Card */}
            <div
              onClick={() => setTaxConfig((prev) => ({ ...prev, mode: TAX_MODES.PRE_TAX }))}
              style={{
                border: `2px solid ${taxConfig.mode === TAX_MODES.PRE_TAX ? '#FF5E14' : '#E2E8F0'}`,
                backgroundColor: taxConfig.mode === TAX_MODES.PRE_TAX ? '#FFF7ED' : '#FFFFFF',
                borderRadius: '14px',
                padding: '14px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontWeight: 800, fontSize: '13.5px', color: '#0F172A' }}>
                  Pre-Tax (Tax-Inclusive)
                </span>
                {taxConfig.mode === TAX_MODES.PRE_TAX && (
                  <span style={{ backgroundColor: '#FF5E14', color: '#fff', borderRadius: '50%', padding: '2px' }}>
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '11.5px', color: '#64748B', lineHeight: 1.4 }}>
                <strong>Customer pays exact entered price (e.g. ₹100).</strong> Product price absorbs the tax.
                Taxable value = ₹95.24, Tax = ₹4.76.
              </p>
            </div>

            {/* Post-Tax Card */}
            <div
              onClick={() => setTaxConfig((prev) => ({ ...prev, mode: TAX_MODES.POST_TAX }))}
              style={{
                border: `2px solid ${taxConfig.mode === TAX_MODES.POST_TAX ? '#FF5E14' : '#E2E8F0'}`,
                backgroundColor: taxConfig.mode === TAX_MODES.POST_TAX ? '#FFF7ED' : '#FFFFFF',
                borderRadius: '14px',
                padding: '14px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontWeight: 800, fontSize: '13.5px', color: '#0F172A' }}>
                  Post-Tax (Tax-Exclusive)
                </span>
                {taxConfig.mode === TAX_MODES.POST_TAX && (
                  <span style={{ backgroundColor: '#FF5E14', color: '#fff', borderRadius: '50%', padding: '2px' }}>
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '11.5px', color: '#64748B', lineHeight: 1.4 }}>
                <strong>Tax is added on top.</strong> Customer pays base price + tax.
                Base = ₹100, Tax (5%) = ₹5.00, Final = ₹105.00.
              </p>
            </div>
          </div>
        </div>

        {/* GST Presets */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B' }}>
              Quick Tax Presets
            </label>
            <span style={{ fontSize: '11.5px', color: '#64748B' }}>1-Click Apply</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {TAX_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyPreset(p)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '10px',
                  backgroundColor: '#F8FAFC',
                  border: '1.5px solid #CBD5E1',
                  color: '#334155',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#FF5E14')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#CBD5E1')}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Configurable Tax Components Table */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <label style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B' }}>
              Tax Components ({taxConfig.components.length} configured — Total: {totalRate.toFixed(2)}%)
            </label>
            <button
              type="button"
              onClick={handleAddComponent}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                borderRadius: '8px',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                border: '1px solid #BFDBFE',
                fontSize: '11.5px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              <Plus size={13} />
              <span>Add Component</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {taxConfig.components.map((comp, idx) => (
              <div
                key={comp.id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  backgroundColor: comp.enabled ? '#FAFAFA' : '#F1F5F9',
                  border: '1px solid #E2E8F0',
                }}
              >
                {/* Enable checkbox */}
                <input
                  type="checkbox"
                  checked={comp.enabled}
                  onChange={(e) => handleUpdateComponent(idx, 'enabled', e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#FF5E14', cursor: 'pointer' }}
                />

                {/* Name */}
                <input
                  type="text"
                  value={comp.name}
                  onChange={(e) => handleUpdateComponent(idx, 'name', e.target.value)}
                  placeholder="e.g. CGST, SGST, IGST"
                  style={{
                    flex: 2,
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    outline: 'none',
                  }}
                />

                {/* Percentage Rate */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={comp.rate}
                    onChange={(e) => handleUpdateComponent(idx, 'rate', Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      outline: 'none',
                      textAlign: 'right',
                    }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#64748B' }}>%</span>
                </div>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => handleDeleteComponent(idx)}
                  disabled={taxConfig.components.length <= 1}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: taxConfig.components.length <= 1 ? '#CBD5E1' : '#EF4444',
                    cursor: taxConfig.components.length <= 1 ? 'not-allowed' : 'pointer',
                    padding: '4px',
                  }}
                  title="Remove Component"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* GSTIN / Tax Number Input */}
        <div style={{ marginBottom: '22px' }}>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#1E293B', marginBottom: '6px' }}>
            Restaurant GSTIN / Tax Identification Number (Optional)
          </label>
          <input
            type="text"
            value={taxConfig.gstin}
            onChange={(e) => setTaxConfig((prev) => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
            placeholder="e.g. 07AAAAA0000A1Z5"
            maxLength={15}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1.5px solid #CBD5E1',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.05em',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Live Simulator & Breakdown Preview (Interactive Test) */}
        <div
          style={{
            backgroundColor: '#F8FAFC',
            border: '1.5px dashed #CBD5E1',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '22px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calculator size={16} color="#FF5E14" />
              <span style={{ fontWeight: 800, fontSize: '13px', color: '#0F172A' }}>
                Live Calculation Simulator
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748B' }}>Entered Price: ₹</span>
              <input
                type="number"
                value={simPrice}
                onChange={(e) => setSimPrice(Number(e.target.value))}
                style={{
                  width: '75px',
                  padding: '4px 6px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontWeight: 800,
                  fontSize: '13px',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
            <div style={{ backgroundColor: '#FFFFFF', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                Base Price
              </div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#0F172A', marginTop: '2px' }}>
                ₹{livePreview.basePrice.toFixed(2)}
              </div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#EA580C', textTransform: 'uppercase' }}>
                Tax ({livePreview.effectiveRate}%)
              </div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#EA580C', marginTop: '2px' }}>
                ₹{livePreview.totalTax.toFixed(2)}
              </div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#16A34A', textTransform: 'uppercase' }}>
                Final Customer Price
              </div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#16A34A', marginTop: '2px' }}>
                ₹{livePreview.finalPrice.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Component Itemization list */}
          {livePreview.components.length > 0 && (
            <div style={{ marginTop: '12px', borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', marginBottom: '6px' }}>
                Itemized Tax Breakdown:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {livePreview.components.map((c, i) => (
                  <span
                    key={i}
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: '#334155',
                    }}
                  >
                    {c.name} ({c.rate}%): <strong>₹{c.amount.toFixed(2)}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                border: '1.5px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#475569',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 24px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: saveSuccess ? '#16A34A' : '#FF5E14',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '13.5px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(255,94,20,0.3)',
              transition: 'all 0.15s ease',
            }}
          >
            {saveSuccess ? <Check size={16} strokeWidth={3} /> : <Save size={16} />}
            <span>{saveSuccess ? 'Saved Successfully!' : 'Save Tax Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
