import "dotenv/config";
import express, { Application } from "express";
import http from "http";
import { Server } from "socket.io";

const port = process.env.PORT; // Get port

const app: Application = express(); // Create express application
const server: http.Server = http.createServer(app);
const io: Server = new Server(server);

io.on("connection", () => {
  console.log("Connected");
});

server.listen(port, () => {
  console.log(`Server running at port : ${port}`);
});
