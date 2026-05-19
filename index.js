const express = require("express");
const dotenv = require("dotenv");
const app = express();
dotenv.config();
const port = process.env.PORT || 8000;

app.get("/", (req, res) => {
  res.send("server is flying");
});

app.listen(port, () => {
  console.log(`Server is flying on port ${port}`);
});
