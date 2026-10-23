import express from 'express';
import {
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  verifyWaiterPublic,
  staffLogin,
} from '../controllers/staffController.js';

const router = express.Router();

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
