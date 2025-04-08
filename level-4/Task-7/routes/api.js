const express = require("express");
const router = express.Router();
const apiController = require("../controllers/apiController");

// External API endpoints
router.get("/external-data", apiController.getExternalData);
router.post("/external-data", apiController.postExternalData);
router.get("/rate-limit-status", apiController.getRateLimitStatus);

module.exports = router;
