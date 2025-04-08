const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, "database.json");

if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ submissions: [] }, null, 2));
}

app.set("view engine", "ejs");
app.set("views", "./views");

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static("public"));

function readDatabase() {
  const data = fs.readFileSync(DB_PATH, "utf8");
  return JSON.parse(data);
}

// Helper function to write to database
function writeDatabase(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

app.get("/", (req, res) => {
  const db = readDatabase();
  res.render("index", {
    message: null,
    submissions: db.submissions,
  });
});

app.post("/submit", (req, res) => {
  const { name, email, password } = req.body;

  const db = readDatabase();

  // Add new submission
  db.submissions.push({
    id: Date.now().toString(),
    name,
    email,
    password,
    createdAt: new Date().toISOString(),
  });

  writeDatabase(db);

  res.render("index", {
    message: `Thanks for registering, ${name}!`,
    submissions: db.submissions,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
