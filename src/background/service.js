const fs = require("fs");
const path = require("path");

class BackgroundService {
  constructor() {
    this.backgroundPath = path.join(__dirname, "../../public/images/bg.png");
    this.imagesDir = path.join(__dirname, "../../public/images");
  }

  /**
   * Change the background image
   * @param {Object} file - Uploaded file object
   * @returns {Object} Result of the operation
   */
  async changeBackground(file) {
    try {
      // Check if file exists
      if (!file) {
        throw new Error("No file uploaded");
      }

      // Check file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
      ];
      if (!allowedTypes.includes(file.mimetype)) {
        throw new Error(
          "Invalid file type. Only JPEG, PNG, and GIF are allowed"
        );
      }

      // Check file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error("File size too large. Maximum size is 5MB");
      }

      // Delete existing background if it exists
      if (fs.existsSync(this.backgroundPath)) {
        fs.unlinkSync(this.backgroundPath);
      }

      // Save new file as bg.png
      const newBackgroundPath = path.join(this.imagesDir, "bg.png");
      fs.writeFileSync(newBackgroundPath, file.buffer);

      return {
        success: true,
        message: "Background changed successfully",
        filename: "bg.png",
      };
    } catch (error) {
      throw new Error(`Failed to change background: ${error.message}`);
    }
  }

  /**
   * Get current background info
   * @returns {Object} Background information
   */
  async getCurrentBackground() {
    try {
      if (fs.existsSync(this.backgroundPath)) {
        const stats = fs.statSync(this.backgroundPath);
        return {
          exists: true,
          filename: "bg.png",
          size: stats.size,
          modified: stats.mtime,
          path: "/images/bg.png",
        };
      } else {
        return {
          exists: false,
          filename: null,
          size: 0,
          modified: null,
          path: null,
        };
      }
    } catch (error) {
      throw new Error(`Failed to get background info: ${error.message}`);
    }
  }
}

module.exports = new BackgroundService();

