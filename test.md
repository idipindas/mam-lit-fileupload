const express = require("express");
const router = express.Router();

const {
  getStoredImages,
  getStoredImageById,
  checkMayoImageExists,
  saveImageStorage,
  updateImageStorage,
  deleteImageStorage,
  getUsageStats
} = require("../controllers/image-storage.controller");

// Get stored images for a specific org unit
// GET /api/image-storage/org/:orgUnitId/images?limit=50&search=query&userId=123
router.get("/org/:orgUnitId/images", getStoredImages);

// Get usage statistics for an org unit
// GET /api/image-storage/org/:orgUnitId/stats
router.get("/org/:orgUnitId/stats", getUsageStats);

// Check if Mayo image already exists in D2L storage
// GET /api/image-storage/mayo/:mayoImageId/org/:orgUnitId/exists
router.get("/mayo/:mayoImageId/org/:orgUnitId/exists", checkMayoImageExists);

// Get a specific stored image by ID
// GET /api/image-storage/images/:imageId
router.get("/images/:imageId", getStoredImageById);

// Save new image storage record
// POST /api/image-storage/images
router.post("/images", saveImageStorage);

// Update image storage record
// PUT /api/image-storage/images/:imageId
router.put("/images/:imageId", updateImageStorage);

// Delete image storage record (soft delete)
// DELETE /api/image-storage/images/:imageId
router.delete("/images/:imageId", deleteImageStorage);

module.exports = router;
