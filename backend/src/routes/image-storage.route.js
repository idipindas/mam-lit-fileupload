const express = require("express");
const router = express.Router();

const {
  getStoredImages,
  getStoredImageById,
  checkMayoImageExists,
  saveImageStorage,
  updateImageStorage,
  deleteImageStorage,
  getUsageStats,
} = require("../controllers/image-storage.controller");

router.get("/org/:orgUnitId/images", getStoredImages);

router.get("/org/:orgUnitId/stats", getUsageStats);

router.get("/mayo/:mayoImageId/org/:orgUnitId/exists", checkMayoImageExists);

router.get("/images/:imageId", getStoredImageById);

router.post("/images", saveImageStorage);

router.put("/images/:imageId", updateImageStorage);

router.delete("/images/:imageId", deleteImageStorage);

module.exports = router;
