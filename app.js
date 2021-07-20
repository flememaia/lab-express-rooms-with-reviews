// Configure your app.js file with all necessary parts for the (2.)Express server to run: (1.) dotenv and environment 
// variables, configurations for receiving JSON requests, importing routers and setting the database up, and 
// lastly, initializing the server to listen for HTTP requests.

//1.
require("dotenv").config();
//2.
const express = require("express");

const connectToDb = require("./config/db.config");
const userRouter = require("./routes/user.routes");
const roomRouter = require("./routes/user.routes");

const app = express();

app.use(express.json());
app.room(express.json());

async function init() {
  try {
    await connectToDb();

    console.log("Conectado ao banco de dados!");

    app.use("/", userRouter);

    app.use((err, req, res) => {
      if (err) {
        return res.status(500).json({ error: err });
      }
    });

    app.room("/room", roomRouter);

    app.room((err, req, res) => {
      if (err) {
        return res.status(500).json({ error: err });
      }
    });

    app.listen(4000, () => console.log("Servidor rodando na porta 4000!"));
  } catch (err) {
    console.log("Erro ao conectar ao banco de dados!", err);
    process.exit(1);
  }
}
init();