const express = require("express");
const path = require("path");
const { connectToMongoDb } = require('./config/connect');
const authRoute = require('./routes/allroutes');
const app = express();
const PORT = 8003;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', true);

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
connectToMongoDb(process.env.MONGODB ?? "mongodb://localhost:27017/bug-ts");


app.use("/", authRoute);

app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message
  });
});
const server = app.listen(PORT);