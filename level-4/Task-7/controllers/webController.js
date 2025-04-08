const ExternalApiService = require("../services/externalApi");

exports.renderHome = (req, res) => {
  res.render("index", { title: "API Integration Demo" });
};

exports.renderApiPage = async (req, res, next) => {
  try {
    const apiService = new ExternalApiService();
    const hasToken = await apiService.hasValidToken();
    res.render("api-demo", {
      title: "External API Demo",
      hasToken,
      authUrl: hasToken ? null : apiService.getAuthUrl(),
    });
  } catch (err) {
    next(err); // Pass errors to the error handling middleware
  }
};

exports.handleOAuthCallback = async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code) {
      throw new Error("Authorization code not provided");
    }

    const apiService = new ExternalApiService();
    await apiService.getAccessToken(code);
    res.redirect("/external-api");
  } catch (err) {
    next(err); // Pass errors to the error handling middleware
  }
};
