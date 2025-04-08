// models/RateLimit.js
const mongoose = require("mongoose");

const rateLimitSchema = new mongoose.Schema(
  {
    ip: { type: String, required: true, index: true },
    endpoint: { type: String, required: true },
    count: { type: Number, default: 0 },
    lastRequest: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

rateLimitSchema.statics.check = async function (ip, endpoint) {
  const WINDOW_SIZE = 15 * 60 * 1000; // 15 minutes
  const MAX_REQUESTS = 100;

  const record = await this.findOneAndUpdate(
    { ip, endpoint },
    { $inc: { count: 1 }, lastRequest: Date.now() },
    { new: true, upsert: true }
  );

  const isExceeded =
    record.count > MAX_REQUESTS &&
    Date.now() - record.lastRequest < WINDOW_SIZE;

  return {
    exceeded: isExceeded,
    count: record.count,
    remaining: isExceeded ? 0 : MAX_REQUESTS - record.count,
  };
};

module.exports = mongoose.model("RateLimit", rateLimitSchema);