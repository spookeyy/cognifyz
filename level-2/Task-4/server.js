const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, "database.json");

if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ submissions: [] }));
}

app.set("view engine", "ejs");
app.set("views", "./views");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));

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
}

function validateFormData(data) {
  const errors = {};

  if (!data.name || data.name.length < 2)
    errors.name = "Name must be at least 2 characters";
  if (!data.email || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(data.email))
    errors.email = "Please enter a valid email";
  if (!data.password || data.password.length < 6)
    errors.password = "Password must be at least 6 characters";

  return { isValid: Object.keys(errors).length === 0, errors };
}

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

// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}