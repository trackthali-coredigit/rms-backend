require("dotenv").config();
const path = require('path');
const express = require("express");
const app = express();
var bodyParser = require("body-parser");
const PORT = process.env.PORT;
const cors = require('cors')
app.use(cors());
const http = require("http")
// const https = require("https")
const fs =require("fs");
const { db } = require('./config/db'); 
global.db = db;

app.use('/uploads', express.static('uploads'));
const swaggerUi = require('swagger-ui-express');
app.use(express.json());

const superAdmin_router = require("./routers/super.admin");
const admin_router = require("./routers/admin");
const barista_router = require("./routers/barista")
const user_router = require('./routers/user');
const waiter_router = require('./routers/waiter');
const { socketConfig } = require("./config/socketConfig");
const { setIO } = require("./config/socketSetup");

app.get("/", (req, res) => {
  res.send("Server is running...");
});

// const options = {
//       key: fs.readFileSync(process.env.PRIVATEKEY),
//       cert: fs.readFileSync(process.env.CERTKEY),
// };
// const httpServer = https.createServer(options, app);
let httpServer = http.createServer(app);
let io = setIO(httpServer)
socketConfig(io)

app.use("/", superAdmin_router);
app.use("/", admin_router);
app.use("/", barista_router);
app.use("/", waiter_router);
app.use("/", user_router);

app.use('/api-docs', swaggerUi.serve, async (_req, res, next) => {
  try {
    // const swaggerDocument = require('./swagger.json');
    const swaggerDocument = require(path.join(__dirname, 'swagger.json'));
    return swaggerUi.setup(swaggerDocument)(_req, res, next);
  } catch (error) {
    console.error('Failed to load swagger document:', error);
    res.status(500).send('Failed to load swagger documentation');
  }
});

const start = async () => {
  httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  try {
    await db.sequelize.authenticate();
    console.log('Connection has been established successfully.');
    // await db.sequelize.sync({force: true }); alter: true
    console.log("...........................................................................")
    // await db.sequelize.sync({alter: true});  
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};
start();