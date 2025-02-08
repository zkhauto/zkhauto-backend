import express from "express";
const app = express();
const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Hello from ZKHAUTO Backend!");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
