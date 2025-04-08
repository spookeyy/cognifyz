const express = require("express");
const router = express.Router();
const webController = require("../controllers/webController");

router.get("/", webController.renderHome);
router.get("/external-api", webController.renderApiPage);
router.get("/oauth-callback", webController.handleOAuthCallback);

module.exports = router;
