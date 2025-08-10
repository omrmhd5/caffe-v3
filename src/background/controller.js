const backgroundService = require("./service");

class BackgroundController {
  /**
   * Show the background change page
   */
  async showChangeBackground(req, res) {
    try {
      const backgroundInfo = await backgroundService.getCurrentBackground();
      res.render("background/changeBackground", {
        user: req.user,
        backgroundInfo,
      });
    } catch (error) {
      res.render("background/changeBackground", {
        user: req.user,
        backgroundInfo: null,
        error: error.message,
      });
    }
  }

  /**
   * Handle background change request
   */
  async changeBackground(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const result = await backgroundService.changeBackground(req.file);

      res.json({
        success: true,
        message: result.message,
        filename: result.filename,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get current background info (API endpoint)
   */
  async getBackgroundInfo(req, res) {
    try {
      const backgroundInfo = await backgroundService.getCurrentBackground();
      res.json({
        success: true,
        data: backgroundInfo,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new BackgroundController();

