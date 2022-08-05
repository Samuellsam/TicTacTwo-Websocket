import "dotenv/config";
import express, { Application } from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const port = process.env.PORT; // Get port

const app: Application = express(); // Create express application

app.use(cors({ // Add cors
  origin: '*'
}));

const server: http.Server = http.createServer(app);
const io: Server = new Server(server);

io.on("connection", () => {
  console.log("Connected");
});

server.listen(port, () => {
  console.log(`Server running at port : ${port}`);
});
