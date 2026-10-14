import User from '../models/userModel.js';


import generateToken from '../utils/generateToken.js';
import { uploadToCloudinary } from '../utils/cloudinaryUpload.js';
import { OAuth2Client } from 'google-auth-library';
import { db, isFirestoreReady } from '../config/firebase.js';


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * @desc    Register a new user (with Business details & Logo upload)
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      businessName,
      contactNo,
      phone,
      plan,
      subscriptionPlan,
      startingDate,
      expireDate,
      subscriptionExpiry,
      subscriptionStatus,
      status,
      isLocked,
      lockReason,
      subscriptionPrice,
      foodypayId: customFoodypayId,
    } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please fill in required fields: name, email, and password.');
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      res.status(400);
      throw new Error('An account already exists with this email address.');
    }

    // Safely upload logo to Cloudinary if provided
    let logoData = { url: '', public_id: '' };
    if (req.file) {
      try {
        logoData = await uploadToCloudinary(req.file.buffer, 'foodypay_logos');
      } catch (err) {
        console.warn('Cloudinary upload skipped/failed:', err.message);
      }
    }

    const foodypayId = (customFoodypayId && customFoodypayId.trim()) ? customFoodypayId.trim().toUpperCase() : ('FP-' + Math.floor(100000 + Math.random() * 900000));
    const finalBusinessName = (businessName && businessName.trim()) ? businessName.trim() : `${name.trim()}'s Food Outlet`;
    const finalContactNo = (contactNo && contactNo.trim()) ? contactNo.trim() : (phone && phone.trim()) ? phone.trim() : '+91 98000 00000';
    const planName = plan || subscriptionPlan || 'L1';
    const startDate = startingDate || new Date().toISOString();
    const expiryDate = expireDate || subscriptionExpiry || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const userStatus = status || subscriptionStatus || (isLocked ? 'Locked' : 'Active');
    const userIsLocked = Boolean(isLocked || userStatus === 'Locked');
    const finalLockReason = lockReason || 'Subscription Payment Required';
    const finalPrice = Number(subscriptionPrice) || (planName === 'L3' ? 2999 : planName === 'L2' ? 1499 : 499);

    // Create User & Store Record
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      foodypayId,
      businessName: finalBusinessName,
      contactNo: finalContactNo,
      logo: logoData,
      authProvider: 'local',
      subscriptionPlan: planName,
      subscriptionExpiry: new Date(expiryDate),
      subscriptionStatus: userStatus,
      isLocked: userIsLocked,
      lockReason: finalLockReason,
      subscriptionPrice: finalPrice,
    });

    // 1. PRIMARY STORAGE: Save into Cloud Firestore Business_Users collection
    if (isFirestoreReady()) {
      try {
        await db.collection('Business_Users').doc(foodypayId).set({
          uniqueId: foodypayId,
          businessId: foodypayId,
          id: foodypayId,
          foodypayId: foodypayId,
          businessName: finalBusinessName,
          name: name.trim(),
          ownerName: name.trim(),
          email: cleanEmail,
          phone: finalContactNo,
          contactNo: finalContactNo,
          plan: planName,
          subscriptionPlan: planName,
          startingDate: startDate,
          expireDate: expiryDate,
          subscriptionExpiry: expiryDate,
          status: userStatus,
          subscriptionStatus: userStatus,
          isLocked: userIsLocked,
          lockReason: finalLockReason,
          subscriptionPrice: finalPrice,
          logoUrl: logoData.url || '',
          authProvider: 'local',
          createdAt: startDate,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (fsErr) {
        console.warn('⚠️ Firestore Business_Users save warning:', fsErr.message);
      }
    }

    if (user) {
      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          foodypayId: user.foodypayId,
          name: user.name,
          email: user.email,
          businessName: user.businessName,
          contactNo: user.contactNo,
          logo: user.logo,
          token,
        },
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token (Login)
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    const cleanEmail = email.toLowerCase().trim();

    // Find user and explicitly select password
    const user = await User.findOne({ email: cleanEmail }).select('+password');

    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    if (user.authProvider === 'google' && !user.password) {
      res.status(400);
      throw new Error('This email is registered via Google Login. Please sign in with Google.');
    }

    if (user.isLocked) {
      res.status(403);
      throw new Error(`Account Locked: ${user.lockReason || 'Active subscription required. Please contact Admin.'}`);
    }

    const isMatch = await user.matchPassword(password);

    if (user && isMatch) {
      if (!user.foodypayId) {
        user.foodypayId = 'FP-' + Math.floor(100000 + Math.random() * 900000);
        await user.save();
      }

      const token = generateToken(user._id);

      res.json({
        success: true,
        data: {
          _id: user._id,
          foodypayId: user.foodypayId,
          name: user.name,
          email: user.email,
          businessName: user.businessName,
          contactNo: user.contactNo,
          logo: user.logo,
          token,
        },
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate or Register via Google OAuth ID Token
 * @route   POST /api/auth/google
 * @access  Public
 */
export const googleAuth = async (req, res, next) => {
  try {
    const { credential, businessName, contactNo, email, name, picture, photoURL, googleId, uid } = req.body;

    let gEmail, gName, gPicture, gSub;

    if (credential) {
      try {
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        gEmail = payload.email;
        gName = payload.name;
        gPicture = payload.picture;
        gSub = payload.sub;
      } catch  {
        gEmail = (email || req.body.email || 'merchant@foodypay.com').toLowerCase().trim();
        gName = name || req.body.name || (gEmail ? gEmail.split('@')[0] : 'Google User');
        gPicture = picture || photoURL || req.body.picture || '';
        gSub = googleId || uid || req.body.googleId || req.body.uid || 'google_' + Date.now();
      }
    } else {
      gEmail = (email || req.body.email || 'merchant@foodypay.com').toLowerCase().trim();
      gName = name || req.body.name || (gEmail ? gEmail.split('@')[0] : 'Google User');
      gPicture = picture || photoURL || req.body.picture || '';
      gSub = googleId || uid || req.body.googleId || req.body.uid || 'google_' + Date.now();
    }

    let user = await User.findOne({ email: gEmail });

    if (user) {
      let modified = false;
      if (!user.googleId && gSub) {
        user.googleId = gSub;
        modified = true;
      }
      if (!user.foodypayId) {
        user.foodypayId = 'FP-' + Math.floor(100000 + Math.random() * 900000);
        modified = true;
      }
      if (businessName && businessName.trim() && user.businessName !== businessName.trim()) {
        user.businessName = businessName.trim();
        modified = true;
      }
      if (contactNo && contactNo.trim() && user.contactNo !== contactNo.trim()) {
        user.contactNo = contactNo.trim();
        modified = true;
      }
      if (gPicture && (!user.logo || !user.logo.url)) {
        user.logo = { url: gPicture, public_id: 'google_avatar' };
        modified = true;
      }
      if (modified) await user.save();
    } else {
      user = await User.create({
        name: gName,
        email: gEmail,
        googleId: gSub,
        foodypayId: 'FP-' + Math.floor(100000 + Math.random() * 900000),
        businessName: businessName && businessName.trim() ? businessName.trim() : `${gName}'s Business`,
        contactNo: contactNo && contactNo.trim() ? contactNo.trim() : '+91 98000 00000',
        logo: {
          url: gPicture || '',
          public_id: 'google_avatar',
        },
        authProvider: 'google',
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        _id: user._id,
        foodypayId: user.foodypayId,
        name: user.name,
        email: user.email,
        businessName: user.businessName,
        contactNo: user.contactNo,
        logo: user.logo,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate / Register via Firebase ID Token or Firebase User Object
 * @route   POST /api/auth/firebase
 * @access  Public
 */
export const firebaseAuth = async (req, res, next) => {
  try {
    const { firebaseToken, uid, email, name, picture, emailVerified, businessName, contactNo, providerId } = req.body;

    if (!email && !uid) {
      res.status(400);
      throw new Error('Firebase email or UID is required.');
    }

    const cleanEmail = (email || '').toLowerCase().trim();
    let user = null;

    if (uid) {
      user = await User.findOne({ firebaseUid: uid });
    }
    if (!user && cleanEmail) {
      user = await User.findOne({ email: cleanEmail });
    }

    if (user) {
      let modified = false;
      if (!user.firebaseUid && uid) {
        user.firebaseUid = uid;
        modified = true;
      }
      if (emailVerified !== undefined && user.isEmailVerified !== emailVerified) {
        user.isEmailVerified = Boolean(emailVerified);
        modified = true;
      }
      if (businessName && businessName.trim() && user.businessName !== businessName.trim()) {
        user.businessName = businessName.trim();
        modified = true;
      }
      if (contactNo && contactNo.trim() && user.contactNo !== contactNo.trim()) {
        user.contactNo = contactNo.trim();
        modified = true;
      }
      if (picture && (!user.logo || !user.logo.url)) {
        user.logo = { url: picture, public_id: 'firebase_avatar' };
        modified = true;
      }
      if (!user.foodypayId) {
        user.foodypayId = 'FP-' + Math.floor(100000 + Math.random() * 900000);
        modified = true;
      }
      if (modified) await user.save();
    } else {
      const foodypayId = 'FP-' + Math.floor(100000 + Math.random() * 900000);
      const defaultName = name || (cleanEmail ? cleanEmail.split('@')[0] : 'Merchant');
      const finalBusinessName = businessName && businessName.trim() ? businessName.trim() : `${defaultName}'s Business`;

      user = await User.create({
        name: defaultName,
        email: cleanEmail,
        firebaseUid: uid || null,
        isEmailVerified: Boolean(emailVerified),
        foodypayId,
        businessName: finalBusinessName,
        contactNo: contactNo && contactNo.trim() ? contactNo.trim() : '+91 98000 00000',
        logo: {
          url: picture || '',
          public_id: 'firebase_avatar',
        },
        authProvider: providerId === 'google.com' ? 'google' : 'firebase',
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        _id: user._id,
        foodypayId: user.foodypayId,
        name: user.name,
        email: user.email,
        businessName: user.businessName,
        contactNo: user.contactNo,
        logo: user.logo,
        firebaseUid: user.firebaseUid,
        isEmailVerified: user.isEmailVerified,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        success: true,
        data: user,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all registered users (Admin)
 * @route   GET /api/auth/users
 * @access  Public / Admin
 */
export const getAllUsers = async (req, res, next) => {
  try {
    let users = [];
    try {
      users = await User.find({}).select('-password').sort({ createdAt: -1 }).lean();
    } catch (err) {
      console.warn('MongoDB User find note:', err.message);
    }

    // Merge with Cloud Firestore Business_Users
    const userMap = new Map();

    users.forEach((u) => {
      const key = (u.foodypayId || u.email || String(u._id)).toLowerCase();
      userMap.set(key, {
        ...u,
        _id: u._id,
        foodypayId: u.foodypayId,
        uniqueId: u.foodypayId,
        plan: u.subscriptionPlan || 'L1',
        subscriptionPlan: u.subscriptionPlan || 'L1',
        startingDate: u.createdAt,
        expireDate: u.subscriptionExpiry,
        subscriptionExpiry: u.subscriptionExpiry,
        status: u.subscriptionStatus || (u.isLocked ? 'Locked' : 'Active'),
        subscriptionStatus: u.subscriptionStatus || (u.isLocked ? 'Locked' : 'Active'),
      });
    });

    if (isFirestoreReady()) {
      try {
        const snap = await db.collection('Business_Users').get();
        snap.forEach((doc) => {
          const fu = doc.data();
          const key = (fu.foodypayId || fu.uniqueId || doc.id || fu.email || '').toLowerCase();
          if (!userMap.has(key)) {
            userMap.set(key, {
              _id: doc.id,
              foodypayId: fu.foodypayId || fu.uniqueId || doc.id,
              uniqueId: fu.uniqueId || doc.id,
              name: fu.name || fu.ownerName || '',
              businessName: fu.businessName || '',
              email: fu.email || '',
              contactNo: fu.phone || fu.contactNo || '',
              phone: fu.phone || fu.contactNo || '',
              plan: fu.plan || fu.subscriptionPlan || 'L1',
              subscriptionPlan: fu.plan || fu.subscriptionPlan || 'L1',
              startingDate: fu.startingDate || fu.createdAt,
              expireDate: fu.expireDate || fu.subscriptionExpiry,
              subscriptionExpiry: fu.expireDate || fu.subscriptionExpiry,
              status: fu.status || fu.subscriptionStatus || (fu.isLocked ? 'Locked' : 'Active'),
              subscriptionStatus: fu.status || fu.subscriptionStatus || (fu.isLocked ? 'Locked' : 'Active'),
              isLocked: Boolean(fu.isLocked || fu.status === 'Locked'),
              lockReason: fu.lockReason || 'Subscription Payment Required',
              subscriptionPrice: fu.subscriptionPrice || 0,
              createdAt: fu.createdAt || fu.startingDate || new Date().toISOString(),
            });
          }
        });
      } catch (fsErr) {
        console.warn('Firestore getAllUsers sync note:', fsErr.message);
      }
    }

    const mergedList = Array.from(userMap.values());

    res.json({
      success: true,
      count: mergedList.length,
      data: mergedList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete user account by ID or foodypayId (Admin)
 * @route   DELETE /api/auth/users/:id
 * @access  Public / Admin
 */
export const deleteUserById = async (req, res, next) => {
  try {
    const rawId = req.params.id;
    let user = null;

    if (mongoose.Types.ObjectId.isValid(rawId)) {
      user = await User.findById(rawId);
    }
    if (!user) {
      user = await User.findOne({ foodypayId: rawId.toUpperCase() });
    }
    if (!user) {
      user = await User.findOne({ email: rawId.toLowerCase() });
    }

    let deletedEmail = user ? user.email : rawId;
    let targetFoodypayId = user ? user.foodypayId : rawId;

    if (user) {
      await User.findByIdAndDelete(user._id);
    }

    // Delete from Firestore Business_Users
    if (isFirestoreReady()) {
      try {
        if (targetFoodypayId) {
          await db.collection('Business_Users').doc(targetFoodypayId).delete();
        }
        await db.collection('Business_Users').doc(rawId).delete();
      } catch (fsErr) {
        console.warn('Firestore delete note:', fsErr.message);
      }
    }

    res.json({
      success: true,
      message: `Account (${deletedEmail || rawId}) has been deleted permanently from database.`,
      email: deletedEmail,
      id: rawId,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete user account by Email (Admin)
 * @route   DELETE /api/auth/users/email/:email
 * @access  Public / Admin
 */
export const deleteUserByEmail = async (req, res, next) => {
  try {
    const targetEmail = req.params.email.toLowerCase().trim();
    const user = await User.findOne({ email: targetEmail });
    let foodypayId = user ? user.foodypayId : null;

    if (user) {
      await User.findOneAndDelete({ email: targetEmail });
    }

    // Cloud Firestore deletion
    if (isFirestoreReady()) {
      try {
        if (foodypayId) {
          await db.collection('Business_Users').doc(foodypayId).delete();
        }
        const snap = await db.collection('Business_Users').where('email', '==', targetEmail).get();
        snap.forEach(async (doc) => {
          await doc.ref.delete();
        });
      } catch (fsErr) {
        console.warn('Firestore email delete note:', fsErr.message);
      }
    }

    res.json({
      success: true,
      message: `Account (${targetEmail}) has been deleted permanently from database.`,
      email: targetEmail,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get public merchant details for Customer Menu / Table QR ordering
 * @route   GET /api/auth/merchant/:identifier
 * @access  Public
 */
export const getPublicMerchantDetails = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    let user = null;

    if (identifier && identifier !== 'undefined') {
      if (mongoose.Types.ObjectId.isValid(identifier)) {
        user = await User.findById(identifier).catch(() => null);
      }
    }
    if (!user && identifier) {
      user = await User.findOne({ foodypayId: identifier.toUpperCase() });
    }
    if (!user && identifier) {
      const allUsers = await User.find({});
      user = allUsers.find((u) => {
        const slug = (u.businessName || u.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        return slug === identifier.toLowerCase();
      });
    }

    if (!user) {
      res.status(404);
      throw new Error('Merchant restaurant account not found');
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        foodypayId: user.foodypayId,
        businessName: user.businessName || user.name,
        name: user.name,
        contactNo: user.contactNo,
        logo: user.logo,
        gstPercent: 5,
        upiId: 'merchant@icici',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Check if email exists in database before sending password reset link
 * @route   POST /api/auth/check-email
 * @access  Public
 */
export const checkEmailExists = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      res.status(400);
      throw new Error('Email address is required.');
    }

    const cleanEmail = email.toLowerCase().trim();
    const escapedEmail = cleanEmail.replace(/[-[\]{}()*+?#\\^$|]/g, '\\$&');

    // Case-insensitive exact match with .lean() for maximum speed
    const user = await User.findOne({
      $or: [
        { email: cleanEmail },
        { email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') } }
      ]
    }).lean();

    res.json({
      success: true,
      exists: Boolean(user),
      email: user ? user.email : cleanEmail,
      name: user ? user.name : null,
      businessName: user ? user.businessName : null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle user lock status (Lock / Unlock account requiring subscription)
 * @route   PUT /api/auth/users/:id/lock
 * @access  Public / Admin
 */
export const toggleUserLock = async (req, res, next) => {
  try {
    const rawId = req.params.id;
    const { isLocked, lockReason } = req.body;
    let user = null;

    if (mongoose.Types.ObjectId.isValid(rawId)) {
      user = await User.findById(rawId);
    }
    if (!user) {
      user = await User.findOne({ foodypayId: rawId.toUpperCase() });
    }
    if (!user) {
      user = await User.findOne({ email: rawId.toLowerCase() });
    }

    let finalLocked = isLocked !== undefined ? Boolean(isLocked) : (user ? !user.isLocked : true);
    const finalReason = lockReason || 'Subscription Payment Required';
    const finalStatus = finalLocked ? 'Locked' : 'Active';

    if (user) {
      user.isLocked = finalLocked;
      user.lockReason = finalReason;
      user.subscriptionStatus = finalStatus;
      await user.save();
    }

    // Sync to Cloud Firestore Business_Users
    if (isFirestoreReady()) {
      try {
        const fsDocId = (user && user.foodypayId) ? user.foodypayId : rawId;
        await db.collection('Business_Users').doc(fsDocId).set({
          isLocked: finalLocked,
          status: finalStatus,
          subscriptionStatus: finalStatus,
          lockReason: finalReason,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (fsErr) {
        console.warn('Firestore toggle lock note:', fsErr.message);
      }
    }

    res.json({
      success: true,
      message: `User account is now ${finalLocked ? 'LOCKED' : 'UNLOCKED'}.`,
      data: {
        id: rawId,
        isLocked: finalLocked,
        subscriptionStatus: finalStatus,
        lockReason: finalReason,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update per-account subscription pricing & plan settings
 * @route   PUT /api/auth/users/:id/subscription
 * @access  Public / Admin
 */
export const updateUserSubscription = async (req, res, next) => {
  try {
    const rawId = req.params.id;
    const {
      subscriptionPrice,
      subscriptionPlan,
      plan,
      subscriptionStatus,
      status,
      subscriptionExpiry,
      expireDate,
      startingDate,
    } = req.body;

    const finalPlan = plan || subscriptionPlan;
    const finalStatus = status || subscriptionStatus;
    const finalExpiry = expireDate || subscriptionExpiry;

    let user = null;
    if (mongoose.Types.ObjectId.isValid(rawId)) {
      user = await User.findById(rawId);
    }
    if (!user) {
      user = await User.findOne({ foodypayId: rawId.toUpperCase() });
    }
    if (!user) {
      user = await User.findOne({ email: rawId.toLowerCase() });
    }

    if (user) {
      if (subscriptionPrice !== undefined) user.subscriptionPrice = Number(subscriptionPrice) || 0;
      if (finalPlan) user.subscriptionPlan = finalPlan;
      if (finalStatus) user.subscriptionStatus = finalStatus;
      if (finalExpiry) user.subscriptionExpiry = new Date(finalExpiry);

      if (finalStatus === 'Active') {
        user.isLocked = false;
      } else if (finalStatus === 'Locked' || finalStatus === 'Expired') {
        user.isLocked = true;
      }

      await user.save();
    }

    // Cloud Firestore Sync
    if (isFirestoreReady()) {
      try {
        const fsDocId = (user && user.foodypayId) ? user.foodypayId : rawId;
        const updates = {
          updatedAt: new Date().toISOString(),
        };
        if (subscriptionPrice !== undefined) updates.subscriptionPrice = Number(subscriptionPrice) || 0;
        if (finalPlan) {
          updates.plan = finalPlan;
          updates.subscriptionPlan = finalPlan;
        }
        if (finalStatus) {
          updates.status = finalStatus;
          updates.subscriptionStatus = finalStatus;
          updates.isLocked = finalStatus === 'Locked' || finalStatus === 'Expired';
        }
        if (finalExpiry) {
          updates.expireDate = new Date(finalExpiry).toISOString();
          updates.subscriptionExpiry = new Date(finalExpiry).toISOString();
        }
        if (startingDate) {
          updates.startingDate = new Date(startingDate).toISOString();
        }

        await db.collection('Business_Users').doc(fsDocId).set(updates, { merge: true });
      } catch (fsErr) {
        console.warn('Firestore subscription update note:', fsErr.message);
      }
    }

    res.json({
      success: true,
      message: `Subscription updated successfully.`,
      data: {
        id: rawId,
        plan: finalPlan,
        status: finalStatus,
        expiry: finalExpiry,
      },
    });
  } catch (error) {
    next(error);
  }
};



