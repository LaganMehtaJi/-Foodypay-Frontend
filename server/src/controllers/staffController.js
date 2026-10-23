import Staff from '../models/staffModel.js';
import User from '../models/userModel.js';

// Helper to generate a clean, readable employee ID
const generateEmployeeId = (name, duty, existingCount = 0) => {
  const cleanName = (name || 'staff')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 10);
  const prefix = (duty || 'staff').toLowerCase().slice(0, 6);
  const rand = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${cleanName || 'emp'}-${rand}`;
};

/**
 * @desc    Get all staff for merchant (authenticated or by foodypayId query)
 * @route   GET /api/staff
 * @access  Private / Public with query
 */
export const getStaff = async (req, res, next) => {
  try {
    let query = {};
    if (req.user && req.user._id) {
      query.user = req.user._id;
    } else if (req.query.foodypayId) {
      query.foodypayId = req.query.foodypayId.trim().toUpperCase();
    } else {
      return res.status(400).json({ success: false, message: 'Merchant ID or authentication required' });
    }

    const staffList = await Staff.find(query).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: staffList.length,
      data: staffList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new staff member with duty assignment
 * @route   POST /api/staff
 * @access  Private / Public with foodypayId
 */
export const createStaff = async (req, res, next) => {
  try {
    const { foodypayId, name, phone, duty, pin, employeeId, assignedTables, notes } = req.body;

    let targetUser = req.user;
    let cleanFoodypayId = (foodypayId || (targetUser && targetUser.foodypayId) || '').trim().toUpperCase();

    if (!targetUser) {
      if (!cleanFoodypayId) {
        return res.status(400).json({ success: false, message: 'foodypayId is required' });
      }
      targetUser = await User.findOne({ foodypayId: cleanFoodypayId });
      if (!targetUser) {
        return res.status(404).json({ success: false, message: 'Merchant not found' });
      }
    } else {
      cleanFoodypayId = targetUser.foodypayId || cleanFoodypayId;
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Employee name is required' });
    }

    let finalEmpId = (employeeId || '').trim();
    if (!finalEmpId) {
      const count = await Staff.countDocuments({ user: targetUser._id });
      finalEmpId = generateEmployeeId(name, duty, count);
    }

    // Check if employeeId already exists for this merchant
    const existing = await Staff.findOne({ foodypayId: cleanFoodypayId, employeeId: finalEmpId });
    if (existing) {
      finalEmpId = `${finalEmpId}-${Math.floor(10 + Math.random() * 90)}`;
    }

    const staff = await Staff.create({
      user: targetUser._id,
      foodypayId: cleanFoodypayId,
      employeeId: finalEmpId,
      name: name.trim(),
      phone: (phone || '').trim(),
      duty: duty || 'Waiter',
      pin: pin ? String(pin).trim() : '1234',
      status: 'Active',
      assignedTables: Array.isArray(assignedTables) ? assignedTables : [],
      notes: notes || '',
    });

    res.status(201).json({
      success: true,
      message: `Employee ${staff.name} added successfully as ${staff.duty}`,
      data: staff,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update staff member
 * @route   PUT /api/staff/:id
 * @access  Private / Public with foodypayId
 */
export const updateStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, duty, pin, status, assignedTables, notes, employeeId } = req.body;

    const staff = await Staff.findById(id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    if (name) staff.name = name.trim();
    if (phone !== undefined) staff.phone = phone.trim();
    if (duty) staff.duty = duty;
    if (pin) staff.pin = String(pin).trim();
    if (status) staff.status = status;
    if (assignedTables) staff.assignedTables = assignedTables;
    if (notes !== undefined) staff.notes = notes;
    if (employeeId && employeeId.trim()) staff.employeeId = employeeId.trim();

    await staff.save();

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: staff,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete staff member
 * @route   DELETE /api/staff/:id
 * @access  Private / Public with foodypayId
 */
export const deleteStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const staff = await Staff.findByIdAndDelete(id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({
      success: true,
      message: 'Employee removed successfully',
      data: { id },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Public verification for Waiter Order Taking URL
 * @route   GET /api/staff/waiter/:uniqueId/:waiterId
 * @access  Public
 */
export const verifyWaiterPublic = async (req, res, next) => {
  try {
    const { uniqueId, waiterId } = req.params;
    const cleanUniqueId = (uniqueId || '').trim().toUpperCase();
    const cleanWaiterId = (waiterId || '').trim();

    const waiter = await Staff.findOne({
      foodypayId: cleanUniqueId,
      employeeId: { $regex: new RegExp(`^${cleanWaiterId}$`, 'i') },
      status: 'Active',
    });

    if (!waiter) {
      return res.status(404).json({
        success: false,
        message: 'Waiter ID not found or inactive. Please verify with manager.',
      });
    }

    res.json({
      success: true,
      data: {
        employeeId: waiter.employeeId,
        name: waiter.name,
        duty: waiter.duty,
        status: waiter.status,
        assignedTables: waiter.assignedTables,
        foodypayId: waiter.foodypayId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Staff / Waiter PIN Login
 * @route   POST /api/staff/login
 * @access  Public
 */
export const staffLogin = async (req, res, next) => {
  try {
    const { foodypayId, employeeId, pin } = req.body;
    const cleanUniqueId = (foodypayId || '').trim().toUpperCase();
    const cleanId = (employeeId || '').trim();
    const cleanPin = (pin || '').trim();

    const staff = await Staff.findOne({
      foodypayId: cleanUniqueId,
      employeeId: { $regex: new RegExp(`^${cleanId}$`, 'i') },
      status: 'Active',
    });

    if (!staff) {
      return res.status(401).json({ success: false, message: 'Invalid Employee ID or account inactive' });
    }

    if (staff.pin && staff.pin !== cleanPin) {
      return res.status(401).json({ success: false, message: 'Incorrect PIN' });
    }

    res.json({
      success: true,
      message: `Welcome, ${staff.name}!`,
      data: {
        employeeId: staff.employeeId,
        name: staff.name,
        duty: staff.duty,
        assignedTables: staff.assignedTables,
        foodypayId: staff.foodypayId,
      },
    });
  } catch (error) {
    next(error);
  }
};
