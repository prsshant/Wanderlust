const express = require('express');
const router = express.Router();
const {
  getPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage
} = require('../controllers/packageController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(getPackages)
  .post(protect, authorize('agent'), createPackage);

router.route('/:id')
  .get(getPackageById)
  .put(protect, authorize('agent'), updatePackage)
  .delete(protect, authorize('agent'), deletePackage);

module.exports = router;
