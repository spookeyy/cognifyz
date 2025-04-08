const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

// Configuring EJS as the view engine
app.set("view engine", "ejs");
app.set("views", "./views");

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static("public"));


app.get("/", (req, res) => {
  res.render("index", { message: null });
});

// Route to handle form submission
app.post("/submit", (req, res) => {
  const { name, email, password } = req.body;

  // saving
  console.log("Received form data:", { name, email, password });

  //success message
  res.render("index", {
    message: `Thanks for registering, ${name}! We've sent a confirmation to ${email}.`,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
