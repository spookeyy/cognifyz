const mongoose = require("mongoose");

const externalApiTokenSchema = new mongoose.Schema({
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  expiresIn: { type: Number, required: true },
  valid: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now, expires: "7d" }, // Auto-delete after 7 days
});

externalApiTokenSchema.methods.isValid = function () {
  return (
    this.valid && Date.now() < this.createdAt.getTime() + this.expiresIn * 1000
  );
};

module.exports = mongoose.model("ExternalApiToken", externalApiTokenSchema);
