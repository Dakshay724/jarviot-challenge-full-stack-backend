const express = require("express");
const cors = require("cors");
const { sequelize } = require("./config/config");
require("dotenv").config();

const googleDrive = require("./routes/googleDrive");
const app = express();

app.use("/google", googleDrive);

app.use(express.json());
app.use(cors());
const port = 4040 || process.env.PORT;
sequelize.sync();
sequelize
  .authenticate()
  .then(() => {
    app.listen(port, () => {
      console.log(`server is running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });
