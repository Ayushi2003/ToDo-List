const connection = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: process.env.MYSQL_PORT || 16866, 
  ssl: {
    rejectUnauthorized: true // Essential for Aiven cloud connections
  }
});

connection.connect((err) => {
  if (err) {
    console.error("Database connection failed safely: " + err.stack);
  } else {
    console.log("Database Connected Successfully!");
  }
});

// ... your existing routes (app.get, app.post, etc.)

if (process.env.NODE_ENV !== 'production') {
  app.listen(3000, () => {
    console.log("Running on port 3000");
  });
}

module.exports = app; // Allows Vercel to wrap your Express instance