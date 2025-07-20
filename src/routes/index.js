const express = require("express");
const router = new express.Router();
const { auth, isAdmin } = require("../middleware/auth");


router.get("/", auth, async (req, res) => {
  res.render("index.hbs", {user: req.user});
});

module.exports = router;
