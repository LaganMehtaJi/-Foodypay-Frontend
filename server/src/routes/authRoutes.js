import express from 'express';
import {
  registerUser,
  loginUser,
  googleAuth,
  firebaseAuth,
  getUserProfile,
  getAllUsers,
  deleteUserById,
  deleteUserByEmail,
  getPublicMerchantDetails,
  checkEmailExists,
} from '../controllers/authController.js';
import upload from '../middlewares/uploadMiddleware.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public auth routes
router.post('/register', upload.single('logo'), registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuth);
router.post('/firebase', firebaseAuth);
router.post('/check-email', checkEmailExists);
router.get('/merchant/:identifier', getPublicMerchantDetails);


// Admin User Management routes
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUserById);
router.delete('/users/email/:email', deleteUserByEmail);

// Protected auth route
router.get('/me', protect, getUserProfile);

export default router;

