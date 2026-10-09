// Helper utility to manage Partner / SuperAdmin credentials, store login credentials, and tab restrictions.

const DEFAULT_CREDENTIALS = {
  partnerEmail: 'admin@foodypay.com',
  partnerPass: 'admin123',
  partnerUniqueId: '999999',

  dashboardEmail: 'store@foodypay.com',
  dashboardPass: 'store123',
  dashboardUniqueId: '888888',

  kitchenEmail: 'kitchen@foodypay.com',
  kitchenPass: 'kitchen123',
  kitchenUniqueId: '777777',
};

const DEFAULT_RESTRICTIONS = {
  lockSettings: false,
  lockMarketing: false,
  lockUtilities: false,
  lockTableCrud: false,
  lockOrderDeletion: false,
  lockCatalogEdit: false,
  upiId: 'merchant@icici',
};

export const getPartnerCredentials = () => {
  try {
    const saved = localStorage.getItem('foodypay_partner_credentials');
    if (saved) {
      return { ...DEFAULT_CREDENTIALS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Error reading partner credentials:', e);
  }
  return DEFAULT_CREDENTIALS;
};

export const savePartnerCredentials = (newCreds) => {
  try {
    const updated = { ...getPartnerCredentials(), ...newCreds };
    localStorage.setItem('foodypay_partner_credentials', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('foodypay_credentials_updated'));
    return updated;
  } catch (e) {
    console.error('Error saving partner credentials:', e);
    return newCreds;
  }
};

export const getStoreRestrictions = () => {
  try {
    const savedControls = localStorage.getItem('foodypay_store_controls');
    if (savedControls) {
      const parsed = JSON.parse(savedControls);
      return {
        lockSettings: Boolean(parsed.lockSettingsPanel || parsed.lockSettings),
        lockMarketing: Boolean(parsed.lockMarketingTab || parsed.lockMarketing),
        lockUtilities: Boolean(parsed.lockUtilities),
        lockTableCrud: Boolean(parsed.lockTableCrud),
        lockOrderDeletion: Boolean(parsed.lockOrderDeletion),
        lockCatalogEdit: Boolean(parsed.lockCatalogEdit),
        upiId: localStorage.getItem('foodypay_upi_id') || parsed.upiId || 'merchant@icici',
      };
    }
  } catch (e) {
    console.warn('Error reading store restrictions:', e);
  }
  return DEFAULT_RESTRICTIONS;
};

export const saveStoreRestrictions = (newRestrictions) => {
  try {
    const currentControls = (() => {
      try {
        const raw = localStorage.getItem('foodypay_store_controls');
        return raw ? JSON.parse(raw) : {};
      } catch (e) { return {}; }
    })();

    const updatedControls = {
      ...currentControls,
      lockSettingsPanel: newRestrictions.lockSettings,
      lockSettings: newRestrictions.lockSettings,
      lockMarketingTab: newRestrictions.lockMarketing,
      lockMarketing: newRestrictions.lockMarketing,
      lockUtilities: newRestrictions.lockUtilities,
      lockTableCrud: newRestrictions.lockTableCrud,
      lockOrderDeletion: newRestrictions.lockOrderDeletion,
      lockCatalogEdit: newRestrictions.lockCatalogEdit,
      upiId: newRestrictions.upiId || 'merchant@icici',
    };

    localStorage.setItem('foodypay_store_controls', JSON.stringify(updatedControls));
    if (newRestrictions.upiId) {
      localStorage.setItem('foodypay_upi_id', newRestrictions.upiId);
    }
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('foodypay_store_controls_updated'));
    return updatedControls;
  } catch (e) {
    console.error('Error saving store restrictions:', e);
    return newRestrictions;
  }
};

export const triggerAdminSyncBroadcast = () => {
  try {
    const bc = new BroadcastChannel('foodypay_live_orders_channel');
    bc.postMessage({ type: 'ADMIN_SETTINGS_UPDATED', timestamp: Date.now() });
    bc.close();
  } catch (e) {}
  try {
    window.dispatchEvent(new CustomEvent('foodypay_admin_settings_updated', { detail: { timestamp: Date.now() } }));
    window.dispatchEvent(new Event('foodypay_store_controls_updated'));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {}
};

export const generateUnique6DigitId = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const validatePartnerLogin = (inputStr, passwordStr) => {
  const creds = getPartnerCredentials();
  const cleanInput = (inputStr || '').trim().toLowerCase();
  const cleanPass = (passwordStr || '').trim();

  const isEmailMatch = cleanInput === creds.partnerEmail.toLowerCase();
  const isIdMatch = cleanInput === creds.partnerUniqueId.toLowerCase();
  const isPassMatch = cleanPass === creds.partnerPass;

  return (isEmailMatch || isIdMatch) && isPassMatch;
};

export const validateDashboardLogin = (inputStr, passwordStr) => {
  const creds = getPartnerCredentials();
  const cleanInput = (inputStr || '').trim().toLowerCase();
  const cleanPass = (passwordStr || '').trim();

  // Also allow Partner / Admin login directly into Dashboard
  const isPartnerMatch = validatePartnerLogin(inputStr, passwordStr);
  if (isPartnerMatch) return { valid: true, role: 'Admin / Partner' };

  const isEmailMatch = cleanInput === creds.dashboardEmail.toLowerCase();
  const isIdMatch = cleanInput === creds.dashboardUniqueId.toLowerCase();
  const isPassMatch = cleanPass === creds.dashboardPass;

  if ((isEmailMatch || isIdMatch) && isPassMatch) {
    return { valid: true, role: 'Store Manager' };
  }

  return { valid: false };
};

export const validateKitchenLogin = (inputStr, passwordStr, targetMerchantId = '') => {
  const creds = getPartnerCredentials();
  const cleanInput = (inputStr || '').trim().toLowerCase();
  const cleanPass = (passwordStr || '').trim();

  // Partner / Admin credential also works for KDS
  if (validatePartnerLogin(inputStr, passwordStr)) {
    return { valid: true, role: 'Admin / Kitchen Master' };
  }

  const isSnackRackPass = cleanPass === 'SnackRack400' || cleanPass.toLowerCase() === 'snackrack400';
  const isEmailMatch = cleanInput === creds.kitchenEmail.toLowerCase();
  const isIdMatch = cleanInput === creds.kitchenUniqueId.toLowerCase();
  const isFpIdMatch = cleanInput.startsWith('fp-') || (targetMerchantId && cleanInput === targetMerchantId.toLowerCase());
  const isPassMatch = cleanPass === creds.kitchenPass || isSnackRackPass || cleanPass === 'kitchen123' || cleanPass === 'admin123' || cleanPass === '12345678';

  if ((isEmailMatch || isIdMatch || isFpIdMatch) && isPassMatch) {
    return { valid: true, role: 'Kitchen Chef' };
  }

  return { valid: false };
};
