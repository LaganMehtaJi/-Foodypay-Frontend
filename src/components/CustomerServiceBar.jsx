import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  Send,
  X
} from 'lucide-react';
import {
  SERVICE_REQUEST_TYPES,
  createServiceRequest,
  checkRequestCooldown,
} from '../utils/tableServiceRequests.js';

export default function CustomerServiceBar({ tableId, tableName, businessId, onShowToast }) {
  const [cooldowns, setCooldowns] = useState({});
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customNote, setCustomNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cleanTableName = tableName || tableId || 'Table 1';

  // Tick cooldowns every second
  useEffect(() => {
    const updateCooldowns = () => {
      const nextCooldowns = {};
      SERVICE_REQUEST_TYPES.forEach((t) => {
        const check = checkRequestCooldown(cleanTableName, t.id);
        if (check.isCoolingDown) {
          nextCooldowns[t.id] = check.remainingSeconds;
        }
      });
      setCooldowns(nextCooldowns);
    };

    updateCooldowns();
    const interval = setInterval(updateCooldowns, 1000);
    return () => clearInterval(interval);
  }, [cleanTableName]);

  const handleSendRequest = (typeId, note = '') => {
    setIsSubmitting(true);
    const result = createServiceRequest({
      tableId,
      tableName: cleanTableName,
      type: typeId,
      note,
      businessId,
    });

    setIsSubmitting(false);

    if (result.success) {
      if (onShowToast) {
        onShowToast(`🛎️ ${result.request.typeLabel} requested! Staff notified.`);
      }
      setShowCustomModal(false);
      setCustomNote('');
    } else {
      if (onShowToast) {
        onShowToast(result.message);
      }
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1.5px solid #FED7AA',
        boxShadow: '0 4px 16px rgba(255, 94, 20, 0.08)',
        padding: '12px 16px',
        margin: '12px 0 16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Bell size={16} color="#FF5E14" />
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
            Table Assistance &amp; Quick Service
          </span>
        </div>
        <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>
          {cleanTableName}
        </span>
      </div>

      {/* Buttons Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
          gap: '8px',
        }}
      >
        {SERVICE_REQUEST_TYPES.map((t) => {
          const remainingSecs = cooldowns[t.id] || 0;
          const isCooling = remainingSecs > 0;

          return (
            <button
              key={t.id}
              type="button"
              disabled={isCooling || isSubmitting}
              onClick={() => {
                if (t.id === 'custom') {
                  setShowCustomModal(true);
                } else {
                  handleSendRequest(t.id);
                }
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 4px',
                borderRadius: '12px',
                border: `1.5px solid ${isCooling ? '#E2E8F0' : '#FFEDD5'}`,
                backgroundColor: isCooling ? '#F8FAFC' : '#FFF7ED',
                color: isCooling ? '#94A3B8' : '#C2410C',
                cursor: isCooling ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                minHeight: '62px',
              }}
            >
              <span style={{ fontSize: '18px', marginBottom: '2px' }}>{t.icon}</span>
              <span style={{ fontSize: '11px', fontWeight: 800, textAlign: 'center', lineHeight: 1.2 }}>
                {isCooling ? `${remainingSecs}s` : t.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom Note Modal */}
      {showCustomModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
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
              padding: '20px',
              width: '100%',
              maxWidth: '380px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                ✍️ Custom Request for Staff
              </h4>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <textarea
              rows={3}
              placeholder="e.g. Extra spicy chutney, warm water, child seat..."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                border: '1.5px solid #CBD5E1',
                fontSize: '13px',
                boxSizing: 'border-box',
                outline: 'none',
                marginBottom: '12px',
              }}
            />

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  background: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!customNote.trim()}
                onClick={() => handleSendRequest('custom', customNote)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#FF5E14',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                }}
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
