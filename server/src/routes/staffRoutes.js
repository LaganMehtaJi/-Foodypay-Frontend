import express from 'express';
import {
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  verifyWaiterPublic,
  staffLogin,
  syncStaffBulk,
} from '../controllers/staffController.js';

const router = express.Router();

// Bulk staff sync from POS
router.post('/sync', syncStaffBulk);

// Public routes for Waiter ordering & login
router.get('/waiter/:uniqueId/:waiterId', verifyWaiterPublic);
router.post('/login', staffLogin);

// Staff management routes
router.route('/')
  .get(getStaff)
  .post(createStaff);

router.route('/:id')
  .put(updateStaff)
  .delete(deleteStaff);

export default router;
