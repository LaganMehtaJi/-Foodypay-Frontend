import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Store,
  ShieldCheck,
  Search,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  ShoppingBag,
  CreditCard,
  Package,
  Layers,
  Users,
  Utensils,
  CheckCircle2,
  XCircle,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Clock,
  Check
} from 'lucide-react';

const INITIAL_BUSINESSES = [
  {
    id: 'biz_1',
    foodypayId: 'FP-985569',
    name: 'Lagan Da Dhaba',
    slug: 'lagan-da-dhaba',
    phone: '+91 98123 45678',
    address: 'Connaught Place, New Delhi',
    status: 'open',
    categoriesCount: 0,
    productsCount: 0,
    tablesCount: 6,
    totalSales: 0,
    totalOrders: 0,
    gstPercent: 5,
    upiId: 'lagandhaba@icici',
    logoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&auto=format&fit=crop&q=80',
    createdAt: '12 Jan 2026',
  },
];

export default function AdminDebugPage({ onShowToast }) {
  const navigate = useNavigate();

  const [businesses, setBusinesses] = useState(() => {
    try {
      const saved = localStorage.getItem('foodypay_admin_businesses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_BUSINESSES;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'open' | 'closed'

  // Modal State for Adding / Editing Business
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBiz, setEditingBiz] = useState(null);
  const [bizForm, setBizForm] = useState({
    name: '',
    foodypayId: '',
    phone: '',
    address: '',
    categoriesCount: 6,
    productsCount: 15,
    tablesCount: 6,
    gstPercent: 5,
    upiId: '',
    logoUrl: '',
    status: 'open',
  });

  // Save businesses to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('foodypay_admin_businesses', JSON.stringify(businesses));
    } catch (e) {}
  }, [businesses]);

  // Aggregate Platform Metrics
  const totalSalesAll = businesses.reduce((s, b) => s + (Number(b.totalSales) || 0), 0);
  const totalOrdersAll = businesses.reduce((s, b) => s + (Number(b.totalOrders) || 0), 0);
  const totalProductsAll = businesses.reduce((s, b) => s + (Number(b.productsCount) || 0), 0);
  const totalTablesAll = businesses.reduce((s, b) => s + (Number(b.tablesCount) || 0), 0);
  const activeCount = businesses.filter((b) => b.status === 'open').length;

  const filteredBusinesses = businesses.filter((b) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (b.name || '').toLowerCase().includes(q) ||
      (b.foodypayId || '').toLowerCase().includes(q) ||
      (b.address || '').toLowerCase().includes(q) ||
      (b.phone || '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleToggleBizStatus = (bizId) => {
    setBusinesses((prev) =>
      prev.map((b) => {
        if (b.id === bizId) {
          const nextStatus = b.status === 'open' ? 'closed' : 'open';
          if (onShowToast) onShowToast(`${b.name} status updated to ${nextStatus.toUpperCase()}`);
          return { ...b, status: nextStatus };
        }
        return b;
      })
    );
  };

  const handleOpenAddModal = () => {
    setEditingBiz(null);
    const nextFpId = `FP-${Math.floor(100000 + Math.random() * 900000)}`;
    setBizForm({
      name: '',
      foodypayId: nextFpId,
      phone: '+91 98000 00000',
      address: 'New Delhi, India',
      categoriesCount: 6,
      productsCount: 15,
      tablesCount: 6,
      gstPercent: 5,
      upiId: 'merchant@icici',
      logoUrl: '',
      status: 'open',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (biz) => {
    setEditingBiz(biz);
    setBizForm({
      name: biz.name || '',
      foodypayId: biz.foodypayId || '',
      phone: biz.phone || '',
      address: biz.address || '',
      categoriesCount: biz.categoriesCount || 6,
      productsCount: biz.productsCount || 15,
      tablesCount: biz.tablesCount || 6,
      gstPercent: biz.gstPercent || 5,
      upiId: biz.upiId || '',
      logoUrl: biz.logoUrl || '',
      status: biz.status || 'open',
    });
    setIsModalOpen(true);
  };

  const handleDeleteBiz = (bizId, bizName) => {
    if (!window.confirm(`Are you sure you want to delete ${bizName} from Admin Panel?`)) return;
    setBusinesses((prev) => prev.filter((b) => b.id !== bizId));
    if (onShowToast) onShowToast(`🗑️ Deleted ${bizName} from system registry.`);
  };

  const handleSaveBizSubmit = (e) => {
    e.preventDefault();
    if (!bizForm.name.trim() || !bizForm.foodypayId.trim()) return;

    const slug = bizForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const bizData = {
      name: bizForm.name.trim(),
      foodypayId: bizForm.foodypayId.trim().toUpperCase(),
      slug,
      phone: bizForm.phone.trim(),
      address: bizForm.address.trim(),
      categoriesCount: Number(bizForm.categoriesCount) || 6,
      productsCount: Number(bizForm.productsCount) || 15,
      tablesCount: Number(bizForm.tablesCount) || 6,
      gstPercent: Number(bizForm.gstPercent) || 5,
      upiId: bizForm.upiId.trim() || 'merchant@icici',
      logoUrl: bizForm.logoUrl.trim(),
      status: bizForm.status || 'open',
    };

    if (editingBiz) {
      setBusinesses((prev) =>
        prev.map((b) => (b.id === editingBiz.id ? { ...b, ...bizData } : b))
      );
      if (onShowToast) onShowToast(`Updated ${bizData.name} details!`);
    } else {
      const newBiz = {
        ...bizData,
        id: `biz_${Date.now()}`,
        totalSales: 0,
        totalOrders: 0,
        createdAt: 'Just now',
      };
      setBusinesses((prev) => [newBiz, ...prev]);
      if (onShowToast) onShowToast(`Registered ${newBiz.name} (${newBiz.foodypayId})!`);
    }

    setIsModalOpen(false);
  };

  // Launch Dashboard for specific business
  const handleLaunchDashboardForBiz = (biz) => {
    try {
      const u = {
        name: biz.name,
        businessName: biz.name,
        foodypayId: biz.foodypayId,
        contactNo: biz.phone,
        address: biz.address,
        gstPercent: biz.gstPercent,
        upiId: biz.upiId,
      };
      localStorage.setItem('foodypay_user', JSON.stringify(u));
    } catch (e) {}

    if (onShowToast) onShowToast(`Switched active context to ${biz.name} (${biz.foodypayId})`);
    navigate('/dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0F172A', color: '#F8FAFC', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Admin Header Bar */}
      <header style={{ backgroundColor: '#1E293B', borderBottom: '1px solid #334155', padding: '16px 32px', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#FF5E14', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(255,94,20,0.4)' }}>
              <ShieldCheck size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#FFF', letterSpacing: '-0.02em' }}>
                  FoodyPay Master Admin Debug Panel
                </h1>
                <span style={{ fontSize: '11px', backgroundColor: '#38BDF8', color: '#0F172A', fontWeight: 900, padding: '2px 8px', borderRadius: '12px' }}>
                  /AdminDebug
                </span>
              </div>
              <div style={{ fontSize: '12.5px', color: '#94A3B8', marginTop: '2px' }}>
                Multi-Tenant Merchant Registry • Real-time Business Telemetry &amp; System Inspector
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', backgroundColor: '#064E3B', color: '#34D399', padding: '6px 12px', borderRadius: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34D399', display: 'inline-block' }} />
              System Operational
            </span>

            <button
              onClick={handleOpenAddModal}
              style={{
                backgroundColor: '#FF5E14',
                color: '#FFF',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '13.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(255,94,20,0.35)'
              }}
            >
              <Plus size={16} /> Register New Business
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Body */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Platform Master KPI Banner */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          <div style={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>ONBOARDED BUSINESSES</div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#FFF', marginTop: '4px' }}>{businesses.length}</div>
              <div style={{ fontSize: '12px', color: '#34D399', marginTop: '2px', fontWeight: 700 }}>🟢 {activeCount} Outlets Active</div>
            </div>
            <div style={{ backgroundColor: '#0F172A', padding: '12px', borderRadius: '12px', color: '#FF5E14' }}>
              <Store size={26} />
            </div>
          </div>

          <div style={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL PLATFORM SALES</div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#34D399', marginTop: '4px' }}>₹{totalSalesAll.toLocaleString()}</div>
              <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>Across {totalOrdersAll} total orders</div>
            </div>
            <div style={{ backgroundColor: '#0F172A', padding: '12px', borderRadius: '12px', color: '#34D399' }}>
              <CreditCard size={26} />
            </div>
          </div>

          <div style={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>PRODUCTS &amp; CATEGORIES</div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#38BDF8', marginTop: '4px' }}>{totalProductsAll} Dishes</div>
              <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>Catalog items indexed</div>
            </div>
            <div style={{ backgroundColor: '#0F172A', padding: '12px', borderRadius: '12px', color: '#38BDF8' }}>
              <Package size={26} />
            </div>
          </div>

          <div style={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>TABLE QR STANDEES</div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#F59E0B', marginTop: '4px' }}>{totalTablesAll} Tables</div>
              <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>Contactless QR points</div>
            </div>
            <div style={{ backgroundColor: '#0F172A', padding: '12px', borderRadius: '12px', color: '#F59E0B' }}>
              <QrCode size={26} />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div style={{ display: 'flex', gap: '14px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by Business Name, FoodyPay ID (e.g. FP-985569), City..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px 12px 42px',
                borderRadius: '12px',
                border: '1px solid #334155',
                backgroundColor: '#1E293B',
                color: '#FFF',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', backgroundColor: '#1E293B', padding: '4px', borderRadius: '12px', border: '1px solid #334155' }}>
            {['all', 'open', 'closed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  border: 'none',
                  backgroundColor: statusFilter === st ? '#FF5E14' : 'transparent',
                  color: statusFilter === st ? '#FFF' : '#94A3B8',
                  fontWeight: 800,
                  fontSize: '12px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {st === 'all' ? 'All Outlets' : st === 'open' ? '🟢 Open' : '🔴 Closed'}
              </button>
            ))}
          </div>
        </div>

        {/* Businesses Registry Table */}
        <div style={{ backgroundColor: '#1E293B', borderRadius: '18px', border: '1px solid #334155', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#FFF' }}>
              Registered Outlets Registry ({filteredBusinesses.length})
            </h2>
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>
              Click any merchant to view menu or launch POS dashboard
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#0F172A', color: '#94A3B8', borderBottom: '1px solid #334155', textTransform: 'uppercase', fontSize: '11.5px', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '14px 20px' }}>Business Outlet</th>
                  <th style={{ padding: '14px 20px' }}>FoodyPay ID</th>
                  <th style={{ padding: '14px 20px' }}>Categories</th>
                  <th style={{ padding: '14px 20px' }}>Products</th>
                  <th style={{ padding: '14px 20px' }}>Tables</th>
                  <th style={{ padding: '14px 20px' }}>Total Sales</th>
                  <th style={{ padding: '14px 20px' }}>Outlet Status</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBusinesses.map((biz) => {
                  const customerMenuUrl = `http://localhost:5173/${biz.slug}/${biz.foodypayId}/table-1`;
                  return (
                    <tr key={biz.id} style={{ borderBottom: '1px solid #334155', transition: 'backgroundColor 0.15s ease' }}>
                      {/* Business info */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {biz.logoUrl ? (
                            <img src={biz.logoUrl} alt={biz.name} style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#FF5E14', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                              {biz.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 800, color: '#FFF', fontSize: '14.5px' }}>{biz.name}</div>
                            <div style={{ fontSize: '12px', color: '#94A3B8' }}>{biz.address}</div>
                          </div>
                        </div>
                      </td>

                      {/* ID */}
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ backgroundColor: '#0F172A', border: '1px solid #38BDF8', color: '#38BDF8', padding: '4px 10px', borderRadius: '8px', fontWeight: 800, fontSize: '12.5px' }}>
                          {biz.foodypayId}
                        </span>
                      </td>

                      {/* Categories */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                          <Layers size={15} color="#94A3B8" />
                          <span>{biz.categoriesCount} Categories</span>
                        </div>
                      </td>

                      {/* Products */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                          <Package size={15} color="#FF5E14" />
                          <span>{biz.productsCount} Dishes</span>
                        </div>
                      </td>

                      {/* Tables */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                          <QrCode size={15} color="#F59E0B" />
                          <span>{biz.tablesCount} Tables</span>
                        </div>
                      </td>

                      {/* Sales */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontWeight: 900, color: '#34D399', fontSize: '14.5px' }}>
                          ₹{(biz.totalSales || 0).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>{biz.totalOrders || 0} orders</div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 20px' }}>
                        <button
                          onClick={() => handleToggleBizStatus(biz.id)}
                          style={{
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            backgroundColor: biz.status === 'open' ? '#064E3B' : '#7F1D1D',
                            color: biz.status === 'open' ? '#34D399' : '#FCA5A5'
                          }}
                        >
                          {biz.status === 'open' ? '🟢 Open' : '🔴 Closed'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <a
                            href={customerMenuUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              backgroundColor: '#0F172A',
                              color: '#38BDF8',
                              border: '1px solid #334155',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 700,
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            🌐 Menu Web <ExternalLink size={12} />
                          </a>

                          <button
                            onClick={() => handleLaunchDashboardForBiz(biz)}
                            style={{
                              backgroundColor: '#FF5E14',
                              color: '#FFF',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            📊 POS Dashboard
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(biz)}
                            style={{ backgroundColor: '#334155', color: '#FFF', border: 'none', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer' }}
                            title="Edit Business"
                          >
                            <Edit3 size={14} />
                          </button>

                          <button
                            onClick={() => handleDeleteBiz(biz.id, biz.name)}
                            style={{ backgroundColor: '#7F1D1D', color: '#FCA5A5', border: 'none', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer' }}
                            title="Delete Business"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredBusinesses.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                      No businesses found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Business Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(4px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            borderRadius: '24px',
            maxWidth: '520px',
            width: '100%',
            padding: '28px',
            color: '#FFF',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 900 }}>
              {editingBiz ? `Edit Business: ${editingBiz.name}` : 'Register New Merchant / Business'}
            </h3>

            <form onSubmit={handleSaveBizSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94A3B8', marginBottom: '4px' }}>
                    Business Outlet Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lagan Da Dhaba"
                    value={bizForm.name}
                    onChange={(e) => setBizForm((prev) => ({ ...prev, name: e.target.value }))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0F172A', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94A3B8', marginBottom: '4px' }}>
                    Merchant ID (FoodyPay ID)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FP-985569"
                    value={bizForm.foodypayId}
                    onChange={(e) => setBizForm((prev) => ({ ...prev, foodypayId: e.target.value }))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0F172A', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94A3B8', marginBottom: '4px' }}>
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98123 45678"
                    value={bizForm.phone}
                    onChange={(e) => setBizForm((prev) => ({ ...prev, phone: e.target.value }))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0F172A', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94A3B8', marginBottom: '4px' }}>
                    City / Address
                  </label>
                  <input
                    type="text"
                    placeholder="Connaught Place, New Delhi"
                    value={bizForm.address}
                    onChange={(e) => setBizForm((prev) => ({ ...prev, address: e.target.value }))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0F172A', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94A3B8', marginBottom: '4px' }}>
                    Categories
                  </label>
                  <input
                    type="number"
                    value={bizForm.categoriesCount}
                    onChange={(e) => setBizForm((prev) => ({ ...prev, categoriesCount: e.target.value }))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0F172A', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94A3B8', marginBottom: '4px' }}>
                    Dishes
                  </label>
                  <input
                    type="number"
                    value={bizForm.productsCount}
                    onChange={(e) => setBizForm((prev) => ({ ...prev, productsCount: e.target.value }))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0F172A', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94A3B8', marginBottom: '4px' }}>
                    Tables
                  </label>
                  <input
                    type="number"
                    value={bizForm.tablesCount}
                    onChange={(e) => setBizForm((prev) => ({ ...prev, tablesCount: e.target.value }))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0F172A', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  type="submit"
                  style={{ flex: 1, backgroundColor: '#FF5E14', color: '#FFF', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 800, fontSize: '14px', cursor: 'pointer' }}
                >
                  Save Business Registry
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ backgroundColor: '#334155', color: '#FFF', border: 'none', padding: '12px 18px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
