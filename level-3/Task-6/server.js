require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/userAuthDB")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Connection events
mongoose.connection.on("connecting", () =>
  console.log("Connecting to MongoDB...")
);
mongoose.connection.on("connected", () => console.log("Connected to MongoDB"));
mongoose.connection.on("error", (err) =>
  console.log("MongoDB connection error:", err)
);
mongoose.connection.on("disconnected", () =>
  console.log("Disconnected from MongoDB")
);

// Handle process termination
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  process.exit(0);
});

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Password hashing middleware
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate auth token
userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET || "your-secret-key-here",
    {
      expiresIn: "1h",
    }
  );
};

const User = mongoose.model("User", userSchema);

// Middleware
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());

// Authentication Middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    if (!token) return res.redirect("/login");

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key-here"
    );
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      res.clearCookie("token");
      return res.redirect("/login");
    }

    next();
  } catch (error) {
    res.clearCookie("token");
    res.redirect("/login");
  }
};

// Validation
function validateFormData(data) {
  const errors = {};

  if (!data.name || data.name.length < 2)
    errors.name = "Name must be at least 2 characters";
  if (!data.email || !/^\S+@\S+\.\S+$/.test(data.email))
    errors.email = "Please enter a valid email";
  if (!data.password || data.password.length < 6)
    errors.password = "Password must be at least 6 characters";

  return { isValid: Object.keys(errors).length === 0, errors };
}

// Routes
app.get("/", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).limit(5);
    res.render("index", {
      submissions: users,
      errors: null,
      formData: null,
      success: req.query.success,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

app.get("/login", (req, res) => {
  res.render("login", { error: req.query.error });
});
app.get("/dashboard", (req, res) => {
  res.render("dashboard", { error: req.query.error });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.render("login", {
        error: "Invalid email or password",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.render("login", {
        error: "Invalid email or password",
      });
    }

    const token = user.generateAuthToken();
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600000, // 1 hour
    });

    res.redirect("/dashboard");
  } catch (error) {
    console.error(error);
    res.render("login", {
      error: "Server error. Please try again.",
    });
  }
});

app.get("/dashboard", authenticate, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.render("dashboard", {
      user: req.user,
      users,
    });
  } catch (error) {
    console.error(error);
    res.redirect("/login");
  }
});

app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
});

app.post("/submit", async (req, res) => {
  const validation = validateFormData(req.body);

  if (!validation.isValid) {
    return res.render("index", {
      submissions: await User.find().sort({ createdAt: -1 }).limit(5),
      errors: validation.errors,
      formData: req.body,
      success: false,
    });
  }

  try {
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.render("index", {
        submissions: await User.find().sort({ createdAt: -1 }).limit(5),
        errors: { email: "Email already in use" },
        formData: req.body,
        success: false,
      });
    }

    await User.create(req.body);
    res.redirect("/?success=true");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

// API Routes
app.post("/api/register", async (req, res) => {
  const validation = validateFormData(req.body);
  if (!validation.isValid)
    return res.status(400).json({ errors: validation.errors });

  try {
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser)
      return res.status(400).json({ error: "Email already in use" });

    const user = await User.create(req.body);
    const token = user.generateAuthToken();

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = user.generateAuthToken();
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

// Protected API Routes
app.get("/api/users", authenticate, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
