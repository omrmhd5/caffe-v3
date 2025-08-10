const express = require("express");
const router = express.Router();
const { auth, isSuperAdmin } = require("../middleware/auth");
const backgroundController = require("./controller");
const multer = require("multer");

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// Show background change page (Super Admin only)
router.get(
  "/change",
  auth,
  isSuperAdmin,
  backgroundController.showChangeBackground
);

// Handle background change (Super Admin only)
router.post(
  "/change",
  auth,
  isSuperAdmin,
  upload.single("background"),
  backgroundController.changeBackground
);

// Get background info (Super Admin only)
router.get("/info", auth, isSuperAdmin, backgroundController.getBackgroundInfo);

module.exports = router;

