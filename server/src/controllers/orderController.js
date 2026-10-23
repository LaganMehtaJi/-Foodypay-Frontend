import mongoose from 'mongoose';
import Order from '../models/orderModel.js';
import Customer from '../models/customerModel.js';
import User from '../models/userModel.js';

/**
 * MongoDB Aggregation Pipeline to calculate Today's Sales & Today's Orders
 */
export const calculateTodayOrderStats = async (userId) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const userObjectId = new mongoose.Types.ObjectId(userId);

  const result = await Order.aggregate([
    { $match: { user: userObjectId } },
    {
      $facet: {
        today: [
          { $match: { createdAt: { $gte: startOfDay, $lte: endOfDay } } },
          {
            $group: {
              _id: null,
              todayOrders: { $sum: 1 },
              todaySales: {
                $sum: {
                  $cond: [{ $in: ['$status', ['completed', 'delivered', 'served']] }, '$total', 0]
                }
              },
              todayGross: { $sum: '$total' }
            }
          }
        ],
        total: [
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              totalSales: {
                $sum: {
                  $cond: [{ $in: ['$status', ['completed', 'delivered', 'served']] }, '$total', 0]
                }
              },
              pendingOrders: {
                $sum: {
                  $cond: [{ $in: ['$status', ['new', 'preparing', 'ready', 'out_for_delivery', 'dispatched']] }, 1, 0]
                }
              }
            }
          }
        ]
      }
    }
  ]);

  const todayFacet = result[0]?.today[0] || { todayOrders: 0, todaySales: 0, todayGross: 0 };
  const totalFacet = result[0]?.total[0] || { totalOrders: 0, totalSales: 0, pendingOrders: 0 };

  return {
    todayOrders: todayFacet.todayOrders || 0,
    todaySales: todayFacet.todaySales > 0 ? todayFacet.todaySales : todayFacet.todayGross || 0,
    todayGross: todayFacet.todayGross || 0,
    totalOrders: totalFacet.totalOrders || 0,
    totalSales: totalFacet.totalSales || 0,
    pendingOrders: totalFacet.pendingOrders || 0,
  };
};

/**
 * @desc    Get aggregated today's sales & order stats
 * @route   GET /api/orders/stats
 * @access  Private
 */
export const getOrderStats = async (req, res, next) => {
  try {
    const stats = await calculateTodayOrderStats(req.user._id);
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new public customer order (from table QR code scan or online delivery)
 * @route   POST /api/orders/public
 * @access  Public
 */
export const createPublicOrder = async (req, res, next) => {
  try {
    const { merchantId, foodypayId, type, table, customer, phone, address, paymentMode, items, note, paymentStatus, paymentLabel, subtotal, discount, tax, total, waiterId, waiterName, placedBy } = req.body;

    let targetUser = null;
    if (merchantId && merchantId !== 'undefined') {
      targetUser = await User.findById(merchantId).catch(() => null);
    }
    if (!targetUser && foodypayId && foodypayId !== 'undefined') {
      targetUser = await User.findOne({ foodypayId });
    }
    if (!targetUser) {
      targetUser = await User.findOne(); // Fallback to primary account
    }

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Merchant account not found for order placement' });
    }

    const count = await Order.countDocuments({ user: targetUser._id });
    const orderId = `#FP-${1080 + count + 1}`;

    const orderData = {
      orderId,
      type: type || 'Dine-In',
      table: table || 'Table 1',
      customer: customer || (waiterName ? `Diner (Served by ${waiterName})` : 'Walk-in Guest'),
      phone: phone || '',
      address: address || '',
      paymentMode: paymentMode || 'Cash',
      status: 'new',
      seen: false, // Unseen by merchant -> triggers sound notification
      paymentStatus: paymentStatus || 'cash',
      note: note || '',
      waiterId: waiterId || '',
      waiterName: waiterName || '',
      placedBy: placedBy || (waiterId ? 'Waiter' : 'Customer'),
      items: (items || []).map(i => ({
        pid: i.pid || '',
        name: i.name,
        v: i.v || 'Regular',
        price: Number(i.price !== undefined ? i.price : (i.p !== undefined ? i.p : 0)),
        qty: Number(i.qty || 1),
        isVeg: i.isVeg !== false,
      })),
      subtotal: Number(subtotal) || 0,
      discount: Number(discount) || 0,
      tax: Number(tax) || 0,
      total: Number(total) || 0,
      businessId: (foodypayId || targetUser.foodypayId || merchantId || '').toString().toUpperCase(),
      merchantFilter: (foodypayId || targetUser.foodypayId || merchantId || '').toString().toUpperCase(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save order into MongoDB
    const mongoOrder = await Order.create({
      user: targetUser._id,
      foodypayId: targetUser.foodypayId || (foodypayId || '').toUpperCase(),
      ...orderData,
    });

    // Auto CRM Sync for Customer in MongoDB
    if (customer && customer !== 'Walk-in Guest') {
      try {
        const existingCustomer = await Customer.findOne({ user: targetUser._id, name: customer });
        if (existingCustomer) {
          existingCustomer.ordersCount += 1;
          existingCustomer.totalSales += total || 0;
          existingCustomer.lastOrdered = 'Just now';
          await existingCustomer.save();
        } else {
          await Customer.create({
            user: targetUser._id,
            name: customer,
            phone: phone || '',
            ordersCount: 1,
            totalSales: total || 0,
            lastOrdered: 'Just now',
            tags: ['QR Diner'],
          });
        }
      } catch (custErr) {
        console.warn('Customer auto-create warning:', custErr.message);
      }
    }

    res.status(201).json({
      success: true,
      data: mongoOrder,
      storage: 'mongodb_primary',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all orders for authenticated user
 * @route   GET /api/orders
 * @access  Private
 */
export const getOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const total = await Order.countDocuments({ user: req.user._id }).catch(() => 0);
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .catch(() => []);
    const todayStats = await calculateTodayOrderStats(req.user._id).catch(() => ({}));

    res.json({
      success: true,
      source: 'database_primary',
      count: orders.length,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      currentPage: page,
      data: orders,
      todayStats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get public orders for Kitchen Display System / Table QR view
 * @route   GET /api/orders/public
 * @access  Public (filtered by merchantId or foodypayId)
 */
export const getPublicOrders = async (req, res, next) => {
  try {
    const { merchantId, foodypayId, status, seen } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    let filter = {};

    let targetUser = null;
    if (merchantId && merchantId !== 'undefined') {
      targetUser = await User.findById(merchantId).catch(() => null);
    }
    if (!targetUser && foodypayId && foodypayId !== 'undefined') {
      const cleanFp = foodypayId.toString().trim().toUpperCase();
      targetUser = await User.findOne({ foodypayId: cleanFp }).catch(() => null);
      if (!targetUser && cleanFp.startsWith('SYS-')) {
        targetUser = (await User.findOne({ foodypayId: 'FP-624358' })) || (await User.findOne({}));
      }
    }
    if (!targetUser) {
      targetUser = (await User.findOne({ foodypayId: 'FP-624358' })) || (await User.findOne({}));
    }

    if (targetUser) {
      filter.user = targetUser._id;
    } else if (foodypayId && foodypayId !== 'undefined') {
      filter.foodypayId = foodypayId.toString().trim().toUpperCase();
    }

    if (status && status !== 'all') {
      filter.status = status;
    }
    if (seen !== undefined) {
      filter.seen = seen === 'true';
    }

    const total = await Order.countDocuments(filter).catch(() => 0);
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .catch(() => []);

    res.json({
      success: true,
      source: 'database_primary',
      count: orders.length,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      currentPage: page,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update public/waiter order (add/edit/delete items or update table/customer)
 * @route   PUT /api/orders/public/:id
 * @access  Public / Waiter
 */
export const updatePublicOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { items, subtotal, discount, tax, total, customer, phone, note, status, paymentMode, waiterId, waiterName } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (items && Array.isArray(items)) {
      order.items = items.map(i => ({
        pid: i.pid || '',
        name: i.name,
        v: i.v || 'Regular',
        price: Number(i.price !== undefined ? i.price : (i.p !== undefined ? i.p : 0)),
        qty: Number(i.qty || 1),
        isVeg: i.isVeg !== false,
      }));
    }
    if (subtotal !== undefined) order.subtotal = Number(subtotal);
    if (discount !== undefined) order.discount = Number(discount);
    if (tax !== undefined) order.tax = Number(tax);
    if (total !== undefined) order.total = Number(total);
    if (customer !== undefined) order.customer = customer;
    if (phone !== undefined) order.phone = phone;
    if (note !== undefined) order.note = note;
    if (status) order.status = status;
    if (paymentMode) order.paymentMode = paymentMode;
    if (waiterId) order.waiterId = waiterId;
    if (waiterName) order.waiterName = waiterName;

    await order.save();

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete/Cancel public/waiter order
 * @route   DELETE /api/orders/public/:id
 * @access  Public / Waiter
 */
export const deletePublicOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    await order.deleteOne();
    res.json({
      success: true,
      message: 'Order deleted successfully',
      id,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Sync table order status from Merchant POS (Ordering, KOT Printed, Bill Printed, Settled)
 * @route   POST /api/orders/pos/sync-table-status
 * @access  Public / POS
 */
export const syncPosTableStatus = async (req, res, next) => {
  try {
    const { foodypayId, table, tableName, status, kotPrinted, billPrinted, items, total, subtotal, customer, phone } = req.body;

    const cleanFp = (foodypayId || '').toString().trim().toUpperCase();
    if (!cleanFp || !table) {
      return res.status(400).json({ success: false, message: 'foodypayId and table are required' });
    }

    const targetUser = await User.findOne({ foodypayId: cleanFp });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }

    const rawT = String(tableName || table).trim();
    const cleanNum = rawT.replace(/^table\s*/i, '').trim();
    const tableRegex = new RegExp(`^(table\\s*)?${cleanNum}$`, 'i');

    const cleanStatus = (status || '').toLowerCase().trim();

    // If order is settled or table cleared, close running orders on this table
    if (cleanStatus === 'settled' || cleanStatus === 'completed' || cleanStatus === 'blank') {
      const settledResult = await Order.updateMany(
        {
          user: targetUser._id,
          table: { $regex: tableRegex },
          status: { $nin: ['settled', 'completed', 'cancelled'] },
        },
        {
          $set: {
            status: 'settled',
            seen: true,
            updatedAt: new Date(),
          },
        }
      );
      return res.json({
        success: true,
        message: 'Table orders marked settled',
        modifiedCount: settledResult.modifiedCount,
        table: rawT,
      });
    }

    // Find active order for this table
    let activeOrder = await Order.findOne({
      user: targetUser._id,
      table: { $regex: tableRegex },
      status: { $nin: ['settled', 'completed', 'cancelled'] },
    }).sort({ createdAt: -1 });

    const formattedItems = (Array.isArray(items) && items.length > 0)
      ? items.map(i => ({
          pid: i.pid || i.id || '',
          name: i.name,
          v: i.v || 'Regular',
          price: Number(i.price !== undefined ? i.price : (i.p !== undefined ? i.p : 0)),
          qty: Number(i.qty || 1),
          isVeg: i.isVeg !== false,
        }))
      : [];

    const isKot = !!(kotPrinted || cleanStatus === 'kot_printed');
    const isBill = !!(billPrinted || cleanStatus === 'bill_printed' || cleanStatus === 'billed');
    const assignedStatus = isBill ? 'bill_printed' : (isKot ? 'kot_printed' : (cleanStatus || 'ordering'));

    if (activeOrder) {
      activeOrder.status = assignedStatus;
      activeOrder.kotPrinted = isKot;
      activeOrder.billPrinted = isBill;
      if (formattedItems.length > 0) {
        activeOrder.items = formattedItems;
      }
      if (total !== undefined) activeOrder.total = Number(total);
      if (subtotal !== undefined) activeOrder.subtotal = Number(subtotal);
      if (customer) activeOrder.customer = customer;
      if (phone) activeOrder.phone = phone;
      activeOrder.seen = true;
      await activeOrder.save();

      return res.json({
        success: true,
        message: 'Active table order updated',
        data: activeOrder,
      });
    } else {
      // Create new active table order if items exist
      const count = await Order.countDocuments({ user: targetUser._id });
      const orderId = `#FP-${1080 + count + 1}`;

      const newOrder = await Order.create({
        user: targetUser._id,
        foodypayId: cleanFp,
        orderId,
        type: 'Dine-In',
        table: rawT.toLowerCase().startsWith('table') ? rawT : `Table ${cleanNum}`,
        customer: customer || 'Walk-in Guest',
        phone: phone || '',
        status: assignedStatus,
        kotPrinted: isKot,
        billPrinted: isBill,
        items: formattedItems,
        subtotal: Number(subtotal || total || 0),
        total: Number(total || 0),
        placedBy: 'Counter',
        seen: true,
      });

      return res.json({
        success: true,
        message: 'New table order created and synced',
        data: newOrder,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new manual / counter order
 * @route   POST /api/orders
 * @access  Private
 */
export const createOrder = async (req, res, next) => {
  try {
    const { type, table, customer, phone, items, note, paymentStatus, paymentLabel, subtotal, discount, tax, total } = req.body;

    const count = await Order.countDocuments({ user: req.user._id });
    const orderId = `#FP-${1080 + count + 1}`;

    const order = await Order.create({
      user: req.user._id,
      orderId,
      type: type || 'Dine-In',
      table: table || 'Table 1',
      customer: customer || 'Walk-in Guest',
      phone: phone || '',
      status: 'new',
      seen: true, // Manual order created directly by counter staff is auto-seen
      paymentStatus: paymentStatus || 'cash',
      paymentLabel: paymentLabel || 'Cash on Counter',
      items: items || [],
      note: note || '',
      subtotal: subtotal || 0,
      discount: discount || 0,
      tax: tax || 0,
      total: total || 0,
    });

    // Automatically update or create customer record in CRM
    if (customer && customer !== 'Walk-in Guest') {
      const existingCustomer = await Customer.findOne({ user: req.user._id, name: customer });
      if (existingCustomer) {
        existingCustomer.ordersCount += 1;
        existingCustomer.totalSales += total || 0;
        existingCustomer.lastOrdered = 'Just now';
        await existingCustomer.save();
      } else {
        await Customer.create({
          user: req.user._id,
          name: customer,
          phone: phone || '',
          ordersCount: 1,
          totalSales: total || 0,
          lastOrdered: 'Just now',
        });
      }
    }

    const todayStats = await calculateTodayOrderStats(req.user._id);

    res.status(201).json({
      success: true,
      data: order,
      todayStats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update existing order (Items, Customer info, Payment, Totals)
 * @route   PUT /api/orders/:id
 * @access  Private
 */
export const updateOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (order.status !== 'new') {
      res.status(400);
      throw new Error('Cannot edit order once cooking has started');
    }

    const { type, table, customer, phone, items, note, paymentStatus, paymentLabel, subtotal, discount, tax, total, status } = req.body;

    if (type) order.type = type;
    if (table) order.table = table;
    if (customer) order.customer = customer;
    if (phone !== undefined) order.phone = phone;
    if (items) order.items = items;
    if (note !== undefined) order.note = note;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (paymentLabel) order.paymentLabel = paymentLabel;
    if (subtotal !== undefined) order.subtotal = subtotal;
    if (discount !== undefined) order.discount = discount;
    if (tax !== undefined) order.tax = tax;
    if (total !== undefined) order.total = total;
    if (status) order.status = status;

    await order.save();
    const todayStats = await calculateTodayOrderStats(req.user._id);

    res.json({
      success: true,
      data: order,
      todayStats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update order status / cash settlement
 * @route   PUT /api/orders/:id/status
 * @access  Private
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, paymentStatus, paymentLabel } = req.body;
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (paymentLabel) order.paymentLabel = paymentLabel;
    if (status === 'completed' || status === 'preparing' || status === 'ready') {
      order.seen = true;
    }

    await order.save();
    const todayStats = await calculateTodayOrderStats(req.user._id);

    res.json({
      success: true,
      data: order,
      todayStats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark order as SEEN by counter staff (stops continuous alarm)
 * @route   PUT /api/orders/:id/seen
 * @access  Private
 */
export const markOrderSeen = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }
    order.seen = true;
    await order.save();

    const todayStats = await calculateTodayOrderStats(req.user._id);

    res.json({
      success: true,
      data: order,
      todayStats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete order
 * @route   DELETE /api/orders/:id
 * @access  Private
 */
export const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    const todayStats = await calculateTodayOrderStats(req.user._id);

    res.json({
      success: true,
      message: 'Order deleted successfully',
      todayStats,
    });
  } catch (error) {
    next(error);
  }
};
