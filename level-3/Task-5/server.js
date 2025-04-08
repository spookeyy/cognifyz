const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const cors = require("cors"); //CORS support

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, "database.json");

// Initialize database
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ submissions: [] }));
}

app.set("view engine", "ejs");
app.set("views", "./views");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(cors());

// Database helpers
function getSubmissions() {
  return JSON.parse(fs.readFileSync(DB_PATH));
}

function saveSubmission(data) {
  const db = getSubmissions();
  db.submissions.push({
    ...data,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  return db.submissions[db.submissions.length - 1]; // Return the new submission
}

function updateSubmission(id, data) {
  const db = getSubmissions();
  const index = db.submissions.findIndex((sub) => sub.id === id);
  if (index !== -1) {
    db.submissions[index] = { ...db.submissions[index], ...data };
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    return db.submissions[index];
  }
  return null;
}

function deleteSubmission(id) {
  const db = getSubmissions();
  const index = db.submissions.findIndex((sub) => sub.id === id);
  if (index !== -1) {
    const deleted = db.submissions.splice(index, 1);
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    return deleted[0];
  }
  return null;
}

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

// HTML Routes
app.get("/", (req, res) => {
  res.render("index", {
    submissions: getSubmissions().submissions,
    errors: null,
    formData: null,
    success: req.query.success,
  });
});

app.post("/submit", (req, res) => {
  const validation = validateFormData(req.body);

  if (!validation.isValid) {
    return res.render("index", {
      submissions: getSubmissions().submissions,
      errors: validation.errors,
      formData: req.body,
      success: false,
    });
  }

  saveSubmission(req.body);
  res.redirect("/?success=true");
});

// API Routes
app.get("/api/submissions", (req, res) => {
  res.json(getSubmissions().submissions);
});

app.get("/api/submissions/:id", (req, res) => {
  const submission = getSubmissions().submissions.find(
    (sub) => sub.id === req.params.id
  );
  if (submission) {
    res.json(submission);
  } else {
    res.status(404).json({ error: "Submission not found" });
  }
});

app.post("/api/submissions", (req, res) => {
  const validation = validateFormData(req.body);
  if (!validation.isValid) {
    return res.status(400).json({ errors: validation.errors });
  }

  const newSubmission = saveSubmission(req.body);
  res.status(201).json(newSubmission);
});

app.put("/api/submissions/:id", (req, res) => {
  const validation = validateFormData(req.body);
  if (!validation.isValid) {
    return res.status(400).json({ errors: validation.errors });
  }

  const updated = updateSubmission(req.params.id, req.body);
  if (updated) {
    res.json(updated);
  } else {
    res.status(404).json({ error: "Submission not found" });
  }
});

app.delete("/api/submissions/:id", (req, res) => {
  const deleted = deleteSubmission(req.params.id);
  if (deleted) {
    res.json({ message: "Submission deleted successfully" });
  } else {
    res.status(404).json({ error: "Submission not found" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
