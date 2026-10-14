import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  CheckCircle2,
  Check,
  UserCheck,
  Trash2,
  Volume2,
  VolumeX,
  Sparkles
} from 'lucide-react';
import {
  getAllServiceRequests,
  updateServiceRequestStatus,
  purgeOldServiceRequests,
} from '../utils/tableServiceRequests.js';
import { playWaiterCallSound } from '../utils/soundEffects.js';

export default function TableServiceRequestsSection({ onShowToast }) {
  const [requests, setRequests] = useState(getAllServiceRequests);
  const [filter, setFilter] = useState('active'); // 'active' | 'pending' | 'in_progress' | 'completed' | 'all'
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const handleUpdate = () => {
      setRequests(getAllServiceRequests());
    };

    const handleAlert = (e) => {
      setRequests(getAllServiceRequests());
      if (soundEnabled) {
        playWaiterCallSound();
      }
      if (onShowToast && e.detail) {
        onShowToast(`🛎️ ${e.detail.tableName}: ${e.detail.typeLabel} requested!`);
      }
    };

    window.addEventListener('foodypay_service_requests_updated', handleUpdate);
    window.addEventListener('foodypay_waiter_call_alert', handleAlert);

    return () => {
      window.removeEventListener('foodypay_service_requests_updated', handleUpdate);
      window.removeEventListener('foodypay_waiter_call_alert', handleAlert);
    };
  }, [soundEnabled, onShowToast]);

  const handleUpdateStatus = (id, nextStatus) => {
    updateServiceRequestStatus(id, nextStatus);
    setRequests(getAllServiceRequests());
    if (onShowToast) {
      const label = nextStatus === 'in_progress' ? 'marked In Progress' : 'marked Completed';
      onShowToast(`Service request ${label}`);
    }
  };

  const handlePurge = () => {
    purgeOldServiceRequests();
    setRequests(getAllServiceRequests());
    if (onShowToast) onShowToast('Cleaned up completed requests');
  };

  const filteredRequests = requests.filter((r) => {
    if (filter === 'active') return r.status === 'pending' || r.status === 'in_progress';
    if (filter === 'pending') return r.status === 'pending';
    if (filter === 'in_progress') return r.status === 'in_progress';
    return true;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const inProgressCount = requests.filter((r) => r.status === 'in_progress').length;
  const activeCount = pendingCount + inProgressCount;

  // By user request: Hide / disable Table Service Requests completely until an actual request arrives from dining tables
  if (activeCount === 0) {
    return null;
  }

  const getTimeAgo = (dateStr) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins === 1) return '1 min ago';
      if (diffMins < 60) return `${diffMins} mins ago`;
      const hrs = Math.floor(diffMins / 60);
      return `${hrs} hr ago`;
    } catch {
      return '';
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        border: '1.5px solid #E2E8F0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        padding: '24px',
        margin: '20px 0',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
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
              backgroundColor: pendingCount > 0 ? '#FEF2F2' : '#F0FDF4',
              color: pendingCount > 0 ? '#DC2626' : '#16A34A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bell size={22} className={pendingCount > 0 ? 'animate-bounce' : ''} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                Table Service Requests
              </h3>
              {pendingCount > 0 && (
                <span
                  style={{
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: '12px',
                  }}
                >
                  {pendingCount} PENDING
                </span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>
              Direct customer calls: Waiter, Water, Extra Roti, Cutlery &amp; Bill
            </p>
          </div>
        </div>

        {/* Filter Pills & Audio toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', backgroundColor: '#F1F5F9', padding: '3px', borderRadius: '10px' }}>
            {[
              { id: 'active', label: `Active (${pendingCount + inProgressCount})` },
              { id: 'pending', label: `Pending (${pendingCount})` },
              { id: 'completed', label: 'Completed' },
              { id: 'all', label: 'All' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: filter === f.id ? '#FFFFFF' : 'transparent',
                  color: filter === f.id ? '#0F172A' : '#64748B',
                  fontWeight: filter === f.id ? 800 : 600,
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  boxShadow: filter === f.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute Alert Sound' : 'Enable Alert Sound'}
            style={{
              padding: '8px',
              borderRadius: '10px',
              border: '1.5px solid #E2E8F0',
              backgroundColor: soundEnabled ? '#F0FDF4' : '#F8FAFC',
              color: soundEnabled ? '#16A34A' : '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <button
            type="button"
            onClick={handlePurge}
            title="Clean completed requests"
            style={{
              padding: '8px',
              borderRadius: '10px',
              border: '1.5px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              color: '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Requests Grid */}
      {filteredRequests.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '36px 16px',
            backgroundColor: '#F8FAFC',
            borderRadius: '16px',
            border: '1.5px dashed #CBD5E1',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🛎️</div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#334155' }}>
            No Service Requests Right Now
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
            Customer table assistance requests will appear here with instant sound alerts.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {filteredRequests.map((req) => {
            const isPending = req.status === 'pending';
            const isInProgress = req.status === 'in_progress';
            const isCompleted = req.status === 'completed';

            let borderColor = '#E2E8F0';
            let bgLight = '#FFFFFF';
            let statusBadge = { bg: '#F1F5F9', color: '#64748B', text: 'Completed' };

            if (isPending) {
              borderColor = '#FCA5A5';
              bgLight = '#FFFDFD';
              statusBadge = { bg: '#FEE2E2', color: '#DC2626', text: 'Pending' };
            } else if (isInProgress) {
              borderColor = '#93C5FD';
              bgLight = '#F0F7FF';
              statusBadge = { bg: '#DBEAFE', color: '#1D4ED8', text: 'In Progress' };
            } else {
              statusBadge = { bg: '#DCFCE7', color: '#15803D', text: 'Completed' };
            }

            return (
              <div
                key={req.id}
                style={{
                  border: `1.5px solid ${borderColor}`,
                  backgroundColor: bgLight,
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                  boxShadow: isPending ? '0 4px 12px rgba(220,38,38,0.08)' : '0 2px 6px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Top Info */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>{req.icon || '🛎️'}</span>
                      <span style={{ fontSize: '15px', fontWeight: 900, color: '#0F172A' }}>
                        {req.tableName}
                      </span>
                    </div>

                    <span
                      style={{
                        backgroundColor: statusBadge.bg,
                        color: statusBadge.color,
                        fontSize: '10.5px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {statusBadge.text}
                    </span>
                  </div>

                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#1E293B', marginBottom: '4px' }}>
                    {req.typeLabel}
                  </div>

                  {req.note && (
                    <div
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        fontSize: '11.5px',
                        color: '#475569',
                        fontStyle: 'italic',
                        marginBottom: '6px',
                      }}
                    >
                      "{req.note}"
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748B' }}>
                    <Clock size={12} />
                    <span>{getTimeAgo(req.createdAt)}</span>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
                  {isPending && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(req.id, 'in_progress')}
                      style={{
                        flex: 1,
                        padding: '7px 10px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#2563EB',
                        color: '#FFFFFF',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                    >
                      <UserCheck size={13} />
                      <span>Accept / In Progress</span>
                    </button>
                  )}

                  {!isCompleted && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(req.id, 'completed')}
                      style={{
                        flex: 1,
                        padding: '7px 10px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#16A34A',
                        color: '#FFFFFF',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                    >
                      <Check size={13} strokeWidth={2.5} />
                      <span>Mark Done</span>
                    </button>
                  )}

                  {isCompleted && (
                    <div style={{ fontSize: '11.5px', color: '#16A34A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={13} />
                      <span>Fulfilled &amp; Completed</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
