const ExternalApiService = require("../services/externalApi");
const RateLimit = require("../models/RateLimit");

exports.getExternalData = async (req, res) => {
  try {
    const ip = req.ip;
    const limit = await RateLimit.check(ip, "external-api-get");

    if (limit.exceeded) {
      return res.status(429).json({
        error: "Rate limit exceeded",
        limits: limit,
      });
    }

    const apiService = new ExternalApiService();
    const data = await apiService.fetchData(req.query);

    res.json({
      data,
      limits: limit,
    });
  } catch (error) {
    handleApiError(res, error);
  }
};

exports.postExternalData = async (req, res) => {
  try {
    const ip = req.ip;
    const limit = await RateLimit.check(ip, "external-api-post");

    if (limit.exceeded) {
      return res.status(429).json({
        error: "Rate limit exceeded",
        limits: limit,
      });
    }

    const apiService = new ExternalApiService();
    const data = await apiService.postData(req.body);

    res.json({
      data,
      limits: limit,
    });
  } catch (error) {
    handleApiError(res, error);
  }
};

exports.getRateLimitStatus = async (req, res) => {
  try {
    const ip = req.ip;
    const getLimit = await RateLimit.check(ip, "external-api-get");
    const postLimit = await RateLimit.check(ip, "external-api-post");

    res.json({
      get: getLimit,
      post: postLimit,
    });
  } catch (error) {
    handleApiError(res, error);
  }
};

function handleApiError(res, error) {
  console.error("API Error:", error);

  if (error.response) {
    res.status(error.response.status).json({
      error: "External API error",
      details: error.response.data,
    });
  } else if (error.statusCode) {
    res.status(error.statusCode).json({
      error: error.message,
    });
  } else {
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}

module.exports = exports;