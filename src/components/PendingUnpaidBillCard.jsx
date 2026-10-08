import React from 'react';
import { CreditCard, AlertTriangle, RefreshCw } from 'lucide-react';

export default function PendingUnpaidBillCard({ order, onPayOnline, onPayCash }) {
  if (!order) return null;

  const orderId = order.id || order.orderId || 'ORDER';
  const tableText = order.table !== 'Delivery' ? `Table ${order.table}` : 'Home Delivery';
  const totalAmount = order.total || order.amount || 0;
  const itemsList = Array.isArray(order.items) ? order.items : [];

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
        border: '2px solid #F97316',
        borderRadius: '18px',
        padding: '18px',
        marginBottom: '20px',
        boxShadow: '0 8px 24px rgba(249, 115, 22, 0.15)',
        position: 'relative'
      }}
    >
      {/* Top Warning Badge Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              backgroundColor: '#EA580C',
              color: '#FFFFFF',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(234, 88, 12, 0.4)'
            }}
          >
            <AlertTriangle size={16} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#9A3412' }}>
              Pending Bill Payment
            </h3>
            <span style={{ fontSize: '11.5px', color: '#C2410C', fontWeight: 600 }}>
              Order #{orderId} • {tableText}
            </span>
          </div>
        </div>

        <span
          style={{
            backgroundColor: '#FFEDD5',
            border: '1px solid #F97316',
            color: '#C2410C',
            fontSize: '11px',
            fontWeight: 800,
            padding: '3px 9px',
            borderRadius: '12px',
            textTransform: 'uppercase'
          }}
        >
          UNPAID
        </span>
      </div>

      {/* Items Summary (if any) */}
      {itemsList.length > 0 && (
        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)', borderRadius: '12px', padding: '10px 12px', marginBottom: '14px', border: '1px solid #FDBA74' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#9A3412', marginBottom: '4px' }}>Ordered Items:</div>
          <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.4' }}>
            {itemsList.map((item, idx) => (
              <span key={idx} style={{ display: 'inline-block', marginRight: '10px' }}>
                {item.quantity || item.qty || 1}x {item.name || item.dishName}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Total Amount Payable Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: '12px 16px', borderRadius: '14px', border: '1px solid #FDBA74', marginBottom: '14px' }}>
        <div>
          <span style={{ fontSize: '11.5px', color: '#64748B', display: 'block', fontWeight: 600 }}>Total Amount Due</span>
          <span style={{ fontSize: '20px', fontWeight: 900, color: '#EA580C' }}>₹{totalAmount}</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '11px', color: '#16A34A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
            <RefreshCw size={12} className="spin" /> Live Synced with Counter
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {onPayOnline && (
          <button
            onClick={onPayOnline}
            style={{
              flex: 1,
              minWidth: '140px',
              backgroundColor: '#EA580C',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)'
            }}
          >
            <CreditCard size={15} /> Pay Bill Online (UPI)
          </button>
        )}
        {onPayCash && (
          <button
            onClick={onPayCash}
            style={{
              backgroundColor: '#FFFFFF',
              color: '#9A3412',
              border: '1px solid #F97316',
              borderRadius: '12px',
              padding: '10px 16px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            Pay Cash at Counter
          </button>
        )}
      </div>
    </div>
  );
}
