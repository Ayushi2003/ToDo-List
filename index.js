const express = require("express");
const path = require("path");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("."));

// UPGRADED: Using a connection pool optimized for serverless environments
const pool = mysql.createPool({
  connectionLimit: 10,                 // Keeps up to 10 connections ready to reuse
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: process.env.MYSQL_PORT || 16866,
  ssl: { rejectUnauthorized: true },
  connectTimeout: 5000                 // Fail fast (5s) instead of timing out Vercel (10s)
});

// SAFE HOME ROUTE: Utilizing the connection pool
app.get("/", (req, res) => {
  var today = new Date();
  var options = { weekday: "long", year: "numeric", day: "numeric", month: "long" };
  var day = today.toLocaleDateString("en-US", options);
  
  let sql = "SELECT * from todo";
  
  // Interacting directly with the pool instance
  pool.query(sql, (err, result) => {
    if (err) {
      console.error("Error fetching homepage tasks:", err);
      return res.status(500).send("Database Error on Read: " + err.message);
    }
    res.render("homeUser", {
      kindOfDay: day,
      title: "To-Do List",
      todo: result,
    });
  });
});

app.get("/addTask", (req, res) => {
  res.render("addList", { title: "TODO LIST" });
});

app.post("/save", (req, res) => {
  let data = {
    title: req.body.title,
    description: req.body.description,
    time: req.body.time,
  };
  let sql = "INSERT INTO todo SET ?";
  pool.query(sql, data, (err, result) => {
    if (err) {
      console.error("Error saving task:", err);
      return res.status(500).send("Database Error on Save: " + err.message);
    }
    res.redirect("/");
  });
});

app.get("/edit/:userId", (req, res) => {
  const userId = req.params.userId;
  let sql = `SELECT * from todo where id = ?`;
  pool.query(sql, [userId], (err, result) => {
    if (err) {
      console.error("Error loading task edit page:", err);
      return res.status(500).send("Database Error on Edit View: " + err.message);
    }
    res.render("editList", {
      title: "To-Do List",
      todo: result[0],
    });
  });
});

app.post("/update", (req, res) => {
  const userId = req.body.id;
  let sql = "UPDATE todo SET title = ?, description = ?, time = ? WHERE id = ?";
  let data = [req.body.title, req.body.description, req.body.time, userId];
  
  pool.query(sql, data, (err, result) => {
    if (err) {
      console.error("Error updating task data:", err);
      return res.status(500).send("Database Error on Update: " + err.message);
    }
    res.redirect("/");
  });
});

app.get("/delete/:id", (req, res) => {
  const userId = req.params.id;
  let sql = `DELETE from todo where id = ?`;
  pool.query(sql, [userId], (err, result) => {
    if (err) {
      console.error("Error deleting item:", err);
      return res.status(500).send("Database Error on Delete: " + err.message);
    }
    res.redirect("/");
  });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(3000, () => {
    console.log("Running locally on port 3000");
  });
}

module.exports = app;