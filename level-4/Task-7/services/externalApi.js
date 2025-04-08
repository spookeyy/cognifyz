const axios = require("axios");
const { ExternalApiToken } = require("../models/ExternalApiToken");

class ExternalApiService {
  constructor() {
    this.clientId = process.env.EXTERNAL_API_CLIENT_ID;
    this.clientSecret = process.env.EXTERNAL_API_CLIENT_SECRET;
    this.redirectUri = process.env.EXTERNAL_API_REDIRECT_URI;
  }

  async hasValidToken() {
    const token = await ExternalApiToken.findOne({ valid: true });
    return token && token.isValid();
  }

  getAuthUrl() {
    return `https://api.external.com/oauth/authorize?client_id=${this.clientId}&redirect_uri=${this.redirectUri}&response_type=code`;
  }

  async getAccessToken(code) {
    // Check MongoDB for existing valid token first
    const existingToken = await ExternalApiToken.findOne({ valid: true });
    if (existingToken && existingToken.isValid()) {
      return existingToken.accessToken;
    }

    // If no valid token, request new one
    const response = await axios.post("https://api.external.com/oauth/token", {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      redirect_uri: this.redirectUri,
      grant_type: "authorization_code",
    });

    // Invalidate all previous tokens
    await ExternalApiToken.updateMany({}, { valid: false });

    // Store new token in MongoDB
    await ExternalApiToken.create({
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
      valid: true,
    });

    return response.data.access_token;
  }

  async fetchData(params) {
    const token = await this.getAccessToken();
    const response = await axios.get("https://api.external.com/data", {
      params,
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }
}

module.exports = ExternalApiService;
