const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { getStats, getUsers, deleteUser, updateUser, getActivity, getHealth } = require('../controllers/admin.controller');

// Admin middleware — must be logged in AND isAdmin
const requireAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

router.use(authenticate, requireAdmin);

router.get('/stats',          getStats);
router.get('/users',          getUsers);
router.delete('/users/:id',   deleteUser);
router.patch('/users/:id',    updateUser);
router.get('/activity',       getActivity);
router.get('/health',         getHealth);

module.exports = router;
