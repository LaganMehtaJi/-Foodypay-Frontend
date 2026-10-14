/**
 * FoodyPay Unified Tax & Pricing Calculation Engine
 * 
 * Supports:
 * - Pre-Tax (Tax-Inclusive Pricing): Customer price remains constant.
 *   Taxable = Final / (1 + totalTaxRate / 100)
 *   Tax = Final - Taxable
 *   Example: Final ₹100, 5% tax -> Taxable ₹95.24, Tax ₹4.76
 * 
 * - Post-Tax (Tax-Exclusive Pricing): Tax is added on top of base price.
 *   Tax = Base * (totalTaxRate / 100)
 *   Final = Base + Tax
 *   Example: Base ₹100, 5% tax -> Tax ₹5.00, Final ₹105.00
 * 
 * - Multi-Component Distribution:
 *   Supports 1, 2, 3 or N components (e.g., CGST 2.5% + SGST 2.5%, CGST 4.5% + SGST 0.5%, IGST 5%, VAT, Service Charge).
 *   Component tax is distributed proportionally or by exact configured percentage.
 */

export const TAX_MODES = {
  PRE_TAX: 'PRE_TAX',   // Tax Inclusive
  POST_TAX: 'POST_TAX', // Tax Exclusive
};

export const DEFAULT_TAX_COMPONENTS = [
  { id: 'cgst', name: 'CGST', rate: 2.5, enabled: true },
  { id: 'sgst', name: 'SGST', rate: 2.5, enabled: true },
];

export const TAX_PRESETS = [
  {
    id: 'gst_5_equal',
    name: 'GST 5% (CGST 2.5% + SGST 2.5%)',
    components: [
      { id: 'cgst', name: 'CGST', rate: 2.5, enabled: true },
      { id: 'sgst', name: 'SGST', rate: 2.5, enabled: true },
    ],
  },
  {
    id: 'gst_5_split',
    name: 'Custom Split (CGST 4.5% + SGST 0.5%)',
    components: [
      { id: 'cgst', name: 'CGST', rate: 4.5, enabled: true },
      { id: 'sgst', name: 'SGST', rate: 0.5, enabled: true },
    ],
  },
  {
    id: 'igst_5',
    name: 'IGST 5% (Inter-state)',
    components: [
      { id: 'igst', name: 'IGST', rate: 5.0, enabled: true },
    ],
  },
  {
    id: 'gst_18',
    name: 'GST 18% (CGST 9% + SGST 9%)',
    components: [
      { id: 'cgst', name: 'CGST', rate: 9.0, enabled: true },
      { id: 'sgst', name: 'SGST', rate: 9.0, enabled: true },
    ],
  },
  {
    id: 'gst_12',
    name: 'GST 12% (CGST 6% + SGST 6%)',
    components: [
      { id: 'cgst', name: 'CGST', rate: 6.0, enabled: true },
      { id: 'sgst', name: 'SGST', rate: 6.0, enabled: true },
    ],
  },
  {
    id: 'gst_service',
    name: 'GST 5% + Service Charge 5%',
    components: [
      { id: 'cgst', name: 'CGST', rate: 2.5, enabled: true },
      { id: 'sgst', name: 'SGST', rate: 2.5, enabled: true },
      { id: 'service_charge', name: 'Service Charge', rate: 5.0, enabled: true },
    ],
  },
];

const TAX_STORAGE_KEY = 'foodypay_tax_config_v1';

/**
 * Get active merchant tax configuration
 */
export function getMerchantTaxConfig() {
  try {
    const raw = localStorage.getItem(TAX_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          enabled: parsed.enabled !== undefined ? parsed.enabled : true,
          mode: parsed.mode || TAX_MODES.PRE_TAX, // Default to Pre-Tax (Inclusive) as per Indian restaurant standards
          components: Array.isArray(parsed.components) && parsed.components.length > 0
            ? parsed.components
            : DEFAULT_TAX_COMPONENTS,
          gstin: parsed.gstin || '',
          taxExemptCategories: Array.isArray(parsed.taxExemptCategories) ? parsed.taxExemptCategories : [],
        };
      }
    }
  } catch (e) {
    console.warn('Error reading tax config:', e);
  }

  return {
    enabled: true,
    mode: TAX_MODES.PRE_TAX,
    components: DEFAULT_TAX_COMPONENTS,
    gstin: '',
    taxExemptCategories: [],
  };
}

/**
 * Save merchant tax configuration
 */
export function saveMerchantTaxConfig(config) {
  try {
    const payload = {
      enabled: Boolean(config.enabled),
      mode: config.mode === TAX_MODES.POST_TAX ? TAX_MODES.POST_TAX : TAX_MODES.PRE_TAX,
      components: Array.isArray(config.components) ? config.components : DEFAULT_TAX_COMPONENTS,
      gstin: String(config.gstin || '').trim(),
      taxExemptCategories: Array.isArray(config.taxExemptCategories) ? config.taxExemptCategories : [],
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(TAX_STORAGE_KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('foodypay_tax_config_updated', { detail: payload }));
    return { success: true, config: payload };
  } catch (e) {
    console.error('Failed to save tax config:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Calculate tax breakdown for an individual amount or item
 * 
 * @param {number} inputAmount - The entered price
 * @param {Object} customConfig - Optional tax config override
 * @returns {Object} Tax breakdown with basePrice, totalTax, finalPrice, components
 */
export function calculateTax(inputAmount, customConfig = null) {
  const amount = Number(inputAmount) || 0;
  if (amount <= 0) {
    return {
      basePrice: 0,
      totalTax: 0,
      finalPrice: 0,
      effectiveRate: 0,
      components: [],
      mode: TAX_MODES.PRE_TAX,
    };
  }

  const config = customConfig || getMerchantTaxConfig();
  if (!config.enabled) {
    return {
      basePrice: Math.round(amount * 100) / 100,
      totalTax: 0,
      finalPrice: Math.round(amount * 100) / 100,
      effectiveRate: 0,
      components: [],
      mode: config.mode,
    };
  }

  const activeComponents = (config.components || []).filter((c) => c.enabled && Number(c.rate) > 0);
  const totalRate = activeComponents.reduce((sum, c) => sum + Number(c.rate || 0), 0);

  if (totalRate <= 0) {
    return {
      basePrice: Math.round(amount * 100) / 100,
      totalTax: 0,
      finalPrice: Math.round(amount * 100) / 100,
      effectiveRate: 0,
      components: [],
      mode: config.mode,
    };
  }

  let basePrice = 0;
  let totalTax = 0;
  let finalPrice = 0;
  const componentsBreakdown = [];

  if (config.mode === TAX_MODES.PRE_TAX) {
    // ------------------------------------------------------------------------
    // PRE-TAX (TAX-INCLUSIVE) PRICING:
    // Final Customer Price is fixed (e.g. ₹100)
    // Base Price = Final / (1 + totalRate / 100)
    // Total Tax = Final - Base Price
    // Example: ₹100 at 5% -> Base = 100 / 1.05 = 95.238 -> ₹95.24
    //          Total Tax = 100 - 95.24 = ₹4.76
    // ------------------------------------------------------------------------
    finalPrice = amount;
    const rawBase = finalPrice / (1 + totalRate / 100);
    basePrice = Math.round(rawBase * 100) / 100;
    totalTax = Math.round((finalPrice - basePrice) * 100) / 100;

    // Distribute tax among active components based on their individual weight
    let allocatedTaxSum = 0;
    activeComponents.forEach((comp, idx) => {
      const compRate = Number(comp.rate || 0);
      let compTax = 0;
      if (idx === activeComponents.length - 1) {
        // Last component absorbs any 1-paisa rounding remainder
        compTax = Math.round((totalTax - allocatedTaxSum) * 100) / 100;
      } else {
        const compShare = (compRate / totalRate) * totalTax;
        compTax = Math.round(compShare * 100) / 100;
        allocatedTaxSum += compTax;
      }
      componentsBreakdown.push({
        id: comp.id,
        name: comp.name,
        rate: compRate,
        amount: compTax,
      });
    });
  } else {
    // ------------------------------------------------------------------------
    // POST-TAX (TAX-EXCLUSIVE) PRICING:
    // Base Price is entered amount (e.g. ₹100)
    // Tax is calculated on top: Tax = Base * (totalRate / 100)
    // Final Customer Price = Base + Total Tax
    // Example: ₹100 at 5% -> Tax = ₹5.00, Final = ₹105.00
    // ------------------------------------------------------------------------
    basePrice = amount;
    let accumulatedTax = 0;

    activeComponents.forEach((comp) => {
      const compRate = Number(comp.rate || 0);
      const compTax = Math.round(basePrice * (compRate / 100) * 100) / 100;
      accumulatedTax += compTax;
      componentsBreakdown.push({
        id: comp.id,
        name: comp.name,
        rate: compRate,
        amount: compTax,
      });
    });

    totalTax = Math.round(accumulatedTax * 100) / 100;
    finalPrice = Math.round((basePrice + totalTax) * 100) / 100;
  }

  return {
    basePrice: Number(basePrice.toFixed(2)),
    totalTax: Number(totalTax.toFixed(2)),
    finalPrice: Number(finalPrice.toFixed(2)),
    effectiveRate: Number(totalRate.toFixed(2)),
    components: componentsBreakdown,
    mode: config.mode,
  };
}

/**
 * Calculate full order tax summary across an array of cart/order items
 * Handles item-level quantities and discounts without double taxation
 */
export function calculateOrderTaxes(items = [], orderDiscount = 0, customConfig = null) {
  const config = customConfig || getMerchantTaxConfig();
  const safeItems = Array.isArray(items) ? items : [];

  let subtotalAmount = 0; // Sum of entered prices * qty
  let totalTaxableValue = 0;
  let totalTaxAmount = 0;
  const componentsMap = new Map();

  safeItems.forEach((item) => {
    if (item.isCancelled || item.status === 'cancelled') return;

    const qty = Number(item.qty || item.quantity || 1);
    const unitPrice = Number(item.price !== undefined ? item.price : (item.basePrice || 0));
    const lineTotal = unitPrice * qty;
    subtotalAmount += lineTotal;

    // Check if category is exempt
    const isExempt = config.taxExemptCategories.some(
      (cat) => cat && String(cat).toLowerCase() === String(item.category || '').toLowerCase()
    );

    if (isExempt || !config.enabled) {
      totalTaxableValue += lineTotal;
      return;
    }

    const itemCalc = calculateTax(lineTotal, config);
    totalTaxableValue += itemCalc.basePrice;
    totalTaxAmount += itemCalc.totalTax;

    itemCalc.components.forEach((c) => {
      const current = componentsMap.get(c.name) || { name: c.name, rate: c.rate, amount: 0 };
      current.amount = Math.round((current.amount + c.amount) * 100) / 100;
      componentsMap.set(c.name, current);
    });
  });

  // Apply order-level discount if any
  const discountVal = Number(orderDiscount) || 0;
  let grandTotal = 0;

  if (config.mode === TAX_MODES.PRE_TAX) {
    // In Pre-Tax mode, subtotalAmount was already tax-inclusive
    grandTotal = Math.max(0, subtotalAmount - discountVal);
    // If discount was applied, re-scale taxable value and taxes proportionally
    if (discountVal > 0 && subtotalAmount > 0) {
      const discountRatio = grandTotal / subtotalAmount;
      totalTaxableValue = Math.round(totalTaxableValue * discountRatio * 100) / 100;
      totalTaxAmount = Math.round(totalTaxAmount * discountRatio * 100) / 100;
      componentsMap.forEach((c) => {
        c.amount = Math.round(c.amount * discountRatio * 100) / 100;
      });
    }
  } else {
    // In Post-Tax mode, subtotalAmount was base price
    const discountedBase = Math.max(0, totalTaxableValue - discountVal);
    if (discountVal > 0 && totalTaxableValue > 0) {
      const discountRatio = discountedBase / totalTaxableValue;
      totalTaxAmount = Math.round(totalTaxAmount * discountRatio * 100) / 100;
      componentsMap.forEach((c) => {
        c.amount = Math.round(c.amount * discountRatio * 100) / 100;
      });
      totalTaxableValue = Math.round(discountedBase * 100) / 100;
    }
    grandTotal = Math.round((totalTaxableValue + totalTaxAmount) * 100) / 100;
  }

  return {
    mode: config.mode,
    modeLabel: config.mode === TAX_MODES.PRE_TAX ? 'Tax Inclusive (Pre-Tax)' : 'Tax Exclusive (Post-Tax)',
    subtotal: Math.round(subtotalAmount * 100) / 100,
    taxableValue: Math.round(totalTaxableValue * 100) / 100,
    totalTax: Math.round(totalTaxAmount * 100) / 100,
    discount: discountVal,
    grandTotal: Math.round(grandTotal * 100) / 100,
    components: Array.from(componentsMap.values()),
    gstin: config.gstin,
    taxRatePercent: config.components.reduce((sum, c) => sum + (c.enabled ? Number(c.rate || 0) : 0), 0),
  };
}
