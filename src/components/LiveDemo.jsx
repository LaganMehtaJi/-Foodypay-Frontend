import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  playOrderPlaced,
  playCallWaiter,
  playFoodPreparing,
  playFoodReady,
  playBillCreatedAndTear,
  playBillPaid
} from '../utils/soundEffects';
import ThreeRestaurantScene from './ThreeRestaurantScene';

const ITEMS = [
  {
    n: 'Masala Dosa',
    p: 120,
    v: 1,
    tag: 'Bestseller',
    desc: 'Crispy golden crepe with spiced potato filling & fresh coconut chutney',
    img: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=320&auto=format&fit=crop&q=80'
  },
  {
    n: 'Veg Biryani',
    p: 220,
    v: 1,
    tag: 'Popular',
    desc: 'Slow-dum basmati rice layered with fragrant herbs, saffron & mint',
    img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=320&auto=format&fit=crop&q=80'
  },
  {
    n: 'Butter Chicken',
    p: 340,
    v: 0,
    tag: 'Must Try',
    desc: 'Tender chicken simmered in rich velvety tomato, butter & cashew gravy',
    img: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=320&auto=format&fit=crop&q=80'
  },
  {
    n: 'Cold Coffee',
    p: 110,
    v: 1,
    tag: 'Refreshing',
    desc: 'Chilled double espresso blended with vanilla cream & crushed ice',
    img: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=320&auto=format&fit=crop&q=80'
  }
];

const STAGES = ['new', 'prep', 'ready', 'served'];
const LABELS = ['Start cooking', 'Mark ready', 'Generate Bill & Settle', 'Served'];

const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');

export default function LiveDemo({ onShowToast }) {
  const [cart, setCart] = useState(ITEMS.map(() => 0));
  const [mode, setMode] = useState('qr'); // 'qr' | 'ct'
  const [orderNo, setOrderNo] = useState(0);
  const [tickets, setTickets] = useState([]);
  const [currentTicketId, setCurrentTicketId] = useState(null);
  const [guestView, setGuestView] = useState('menu'); // 'menu' | 'track'
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [show3DScene, setShow3DScene] = useState(true);
  const [active3DStage, setActive3DStage] = useState('food'); // 'food' | 'cook' | 'ready' | 'waiter' | 'cash'
  const [activeReceipt, setActiveReceipt] = useState(null);

  const [reports, setReports] = useState({
    sales: 0,
    orders: 0,
    fee: 0,
    note: 'The fee is charged only when the bill is settled, never when an order is placed.'
  });

  const updateQty = (index, delta) => {
    setCart((prev) => {
      const next = [...prev];
      next[index] = Math.max(0, next[index] + delta);
      return next;
    });
  };

  const total = cart.reduce((sum, qty, idx) => sum + qty * ITEMS[idx].p, 0);

  // 1. PLACE ORDER (Food Model)
  const handlePlaceOrder = () => {
    if (total === 0) return;
    const newOrderNo = orderNo + 1;
    setOrderNo(newOrderNo);

    // Switch 3D Model to Food Plated
    setActive3DStage('food');

    if (soundEnabled) {
      playOrderPlaced();
    }

    const lines = cart
      .map((q, i) => (q ? `${q} × ${ITEMS[i].n}` : null))
      .filter(Boolean);

    const newTicket = {
      id: '#' + (100 + newOrderNo),
      lines,
      total,
      mode,
      stage: 0,
      paid: false
    };

    setTickets((prev) => [newTicket, ...prev]);
    setCurrentTicketId(newTicket.id);
    setCart(ITEMS.map(() => 0));
    setGuestView('track');
    onShowToast('Order sent to the kitchen');
  };

  // 2. CALL WAITER (Waiter Model)
  const handleCallWaiter = () => {
    // Switch 3D Model to Waiter with Silver Tray & Bell
    setActive3DStage('waiter');

    if (soundEnabled) {
      playCallWaiter();
    }
    onShowToast('A waiter is on the way to Table 4');
  };

  // 3. ADVANCE KITCHEN TICKET (Cook -> Ready -> Cash)
  const handleAdvanceKitchen = (ticketId) => {
    setTickets((prevTickets) => {
      return prevTickets.map((t) => {
        if (t.id !== ticketId || t.stage >= 3) return t;
        const nextStage = t.stage + 1;

        // Play appropriate stage sound & Switch 3D model
        if (nextStage === 1) {
          // Preparing: Cook/Chef Model
          setActive3DStage('cook');
          if (soundEnabled) playFoodPreparing();
        } else if (nextStage === 2) {
          // Ready: Served Food & Cloche Model
          setActive3DStage('ready');
          if (soundEnabled) playFoodReady();
        } else if (nextStage === 3) {
          // Bill: Cash & POS Model
          setActive3DStage('cash');
          if (soundEnabled) playBillCreatedAndTear();
        }

        // When reaching served/bill stage
        if (nextStage === 3) {
          setActiveReceipt({
            id: t.id,
            total: t.total,
            lines: t.lines,
            mode: t.mode,
            status: 'unpaid'
          });
        }

        return { ...t, stage: nextStage };
      });
    });
  };

  // 4. USER PAYS BILL (Cash & POS Model)
  const handlePayBill = (ticketId) => {
    setActive3DStage('cash');
    if (soundEnabled) {
      playBillPaid();
    }

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, paid: true } : t))
    );

    setActiveReceipt((prev) => (prev ? { ...prev, status: 'paid' } : null));

    const targetTicket = tickets.find((t) => t.id === ticketId);
    if (targetTicket) {
      const fee = targetTicket.mode === 'qr' ? targetTicket.total * 0.02 : 0;
      setReports((prev) => ({
        sales: prev.sales + targetTicket.total,
        orders: prev.orders + 1,
        fee: prev.fee + fee,
        note:
          targetTicket.mode === 'qr'
            ? `Bill settled: 2% of ${inr(targetTicket.total)} = ${inr(fee)} charged from your wallet.`
            : 'Counter order settled: ₹0 charged.'
      }));
    }

    onShowToast('Bill paid successfully via FoodyPay!');
  };

  const currentTicket = tickets.find((t) => t.id === currentTicketId);

  return (
    <section id="demo" className="demo-section">
      <div className="wrap">
        <div className="demo-head">
          <div>
            <h2>Interactive POS in Action. Watch orders move.</h2>
            <p className="demo-head-desc">
              Experience the complete real-time loop: guest QR ordering, instant kitchen audio cues, live prep stages &amp; digital bill tear settlement.
            </p>
          </div>

          <div className="demo-control-toolbar">
            <button
              type="button"
              className={`sound-toggle-btn ${soundEnabled ? 'active' : ''}`}
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            >
              <span>{soundEnabled ? '🔊 Sound: ON' : '🔇 Sound: MUTED'}</span>
            </button>

            <button
              type="button"
              className={`scene-toggle-btn ${show3DScene ? 'active' : ''}`}
              onClick={() => setShow3DScene(!show3DScene)}
              title="Toggle 3D View"
            >
              <span>{show3DScene ? '🧊 3D Station: ON' : '🧊 3D Station: OFF'}</span>
            </button>
          </div>
        </div>

        {/* 3D INTERACTIVE RESTAURANT STATION */}
        {show3DScene && (
          <div className="three-scene-container-top">
            <ThreeRestaurantScene
              activeStage={active3DStage}
              onStageChange={setActive3DStage}
            />
          </div>
        )}

        {/* 3-PANE BOARD */}
        <div className="board">
          {/* PANE 1: GUEST PHONE */}
          <div className="pane guest-pane" aria-label="Guest phone">
            <h3>Guest <em>Table 4</em></h3>

            {guestView === 'menu' ? (
              <div className="guest-menu-box">
                <div className="seg" role="group" aria-label="Order type">
                  <button
                    type="button"
                    aria-pressed={mode === 'qr'}
                    onClick={() => setMode('qr')}
                  >
                    Scan &amp; order
                  </button>
                  <button
                    type="button"
                    aria-pressed={mode === 'ct'}
                    onClick={() => setMode('ct')}
                  >
                    Counter
                  </button>
                </div>

                <div className="catalog-header-bar">
                  <span className="catalog-badge">RESTAURANT MENU CATALOG</span>
                  <span className="catalog-count">{ITEMS.length} dishes</span>
                </div>

                <div className="catalog-list">
                  {ITEMS.map((item, i) => (
                    <div key={item.n} className="catalog-card">
                      <div className="catalog-info-col">
                        <div className="catalog-top-row">
                          <span
                            className={`dot ${item.v ? '' : 'nv'}`}
                            title={item.v ? 'Veg' : 'Non-veg'}
                          />
                          {item.tag && <span className="catalog-tag">{item.tag}</span>}
                        </div>

                        <div className="catalog-dish-title">{item.n}</div>
                        <div className="catalog-dish-desc">{item.desc}</div>
                        <div className="catalog-dish-price">{inr(item.p)}</div>
                      </div>

                      <div className="catalog-media-col">
                        <div className="catalog-img-box">
                          <img
                            src={item.img}
                            alt={item.n}
                            className="catalog-food-img"
                            loading="lazy"
                          />
                        </div>

                        <div className="catalog-qty-stepper">
                          {cart[i] === 0 ? (
                            <button
                              type="button"
                              className="catalog-add-btn"
                              onClick={() => updateQty(i, 1)}
                            >
                              + Add
                            </button>
                          ) : (
                            <div className="catalog-stepper-box">
                              <button
                                type="button"
                                onClick={() => updateQty(i, -1)}
                                aria-label={`Remove ${item.n}`}
                              >
                                −
                              </button>
                              <span>{cart[i]}</span>
                              <button
                                type="button"
                                onClick={() => updateQty(i, 1)}
                                aria-label={`Add ${item.n}`}
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn primary place"
                  disabled={total === 0}
                  onClick={handlePlaceOrder}
                >
                  {total > 0 ? `Place order · ${inr(total)}` : 'Add items to order'}
                </button>
              </div>
            ) : (
              <div className="track">
                <div>
                  <b style={{ fontFamily: 'var(--display)', fontSize: '1.1rem' }}>
                    Order {currentTicket ? currentTicket.id : ''}
                  </b>
                  <div className="hint">
                    {currentTicket?.mode === 'qr' ? 'QR table order' : 'Counter order'} ·{' '}
                    {currentTicket ? inr(currentTicket.total) : ''}
                  </div>
                </div>

                <ol className="steps">
                  <li className={currentTicket && currentTicket.stage >= 0 ? (currentTicket.stage > 0 ? 'done' : 'now') : ''}>
                    Order placed
                  </li>
                  <li className={currentTicket && currentTicket.stage >= 1 ? (currentTicket.stage > 1 ? 'done' : 'now') : ''}>
                    Preparing
                  </li>
                  <li className={currentTicket && currentTicket.stage >= 2 ? (currentTicket.stage > 2 ? 'done' : 'now') : ''}>
                    Ready
                  </li>
                  <li className={currentTicket && currentTicket.stage >= 3 ? 'done' : ''}>
                    Served
                  </li>
                </ol>

                {/* BILL RECEIPT PREVIEW WHEN SERVED */}
                {currentTicket?.stage === 3 && (
                  <div className="bill-tear-card">
                    <div className="bill-tear-header">
                      <span>FOOD BILL RECEIPT</span>
                      <span className="tear-tag">🧾 TEAR &amp; PAY</span>
                    </div>
                    <div className="bill-amount-row">
                      <span>Total Payable:</span>
                      <b>{inr(currentTicket.total)}</b>
                    </div>
                    {!currentTicket.paid ? (
                      <button
                        type="button"
                        className="btn green small"
                        style={{ width: '100%', marginTop: '8px' }}
                        onClick={() => handlePayBill(currentTicket.id)}
                      >
                        💳 Pay {inr(currentTicket.total)} (FastRail)
                      </button>
                    ) : (
                      <div className="paid-stamp">
                        ✓ PAID &amp; SETTLED
                      </div>
                    )}
                  </div>
                )}

                <div className="row2">
                  <button
                    type="button"
                    className="btn small"
                    onClick={handleCallWaiter}
                  >
                    🛎️ Call waiter
                  </button>
                  <button
                    type="button"
                    className="btn small"
                    onClick={() => setGuestView('menu')}
                  >
                    New order
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* PANE 2: KITCHEN */}
          <div className="pane kitchen-pane">
            <h3>Kitchen <em>tap to move ahead</em></h3>
            <div className="tickets">
              {tickets.length === 0 ? (
                <div className="empty">
                  <b>No tickets yet</b>
                  Place an order on the phone and it lands here instantly.
                </div>
              ) : (
                tickets.map((t) => (
                  <div key={t.id} className={`tk ${STAGES[t.stage]}`}>
                    <header>
                      <span>{t.id}</span>
                      <span>Table 4 · {t.mode === 'qr' ? 'QR' : 'Counter'}</span>
                    </header>
                    <ul>
                      {t.lines.map((line, idx) => (
                        <li key={idx}>{line}</li>
                      ))}
                    </ul>
                    {t.stage < 3 ? (
                      <button
                        type="button"
                        onClick={() => handleAdvanceKitchen(t.id)}
                      >
                        {LABELS[t.stage]}
                      </button>
                    ) : !t.paid ? (
                      <button
                        type="button"
                        className="btn-pay-now"
                        onClick={() => handlePayBill(t.id)}
                      >
                        💵 Customer Pays {inr(t.total)}
                      </button>
                    ) : (
                      <div className="tk-paid-badge">
                        ✓ Settled
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* PANE 3: REPORTS */}
          <div className="pane reports">
            <h3>Reports <em>today</em></h3>
            <div className="stat">
              <small>Sales (served)</small>
              <b>{inr(reports.sales)}</b>
            </div>
            <div className="stat">
              <small>Orders</small>
              <b>{reports.orders}</b>
            </div>
            <div className="stat">
              <small>FoodyPay fee</small>
              <b>{inr(reports.fee)}</b>
            </div>
            <div className="stat">
              <small>You keep</small>
              <b className="g">{inr(reports.sales - reports.fee)}</b>
            </div>
            <div className="note">{reports.note}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
