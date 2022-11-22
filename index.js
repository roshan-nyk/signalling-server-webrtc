const express = require("express");
const app = express();

const http = require("http");
const Socket = require("websocket").server;

// Requiring file system to use local files
// const fs = require("fs");

// // Creating object of key and certificate for SSL
// const options = {
//   key: fs.readFileSync("server.key"),
//   cert: fs.readFileSync("server.crt"),
// };

// const server = http.createServer(options);
// server.listen(3000, (req, res) => {
//   console.log("Listening on port 3000");
// });

var port = process.env.PORT || 3000;

const server = http.createServer(() => {});

// server.listen(port, "192.168.187.136", () => {
//   console.log(`Listening on port ${port}`);
// });

// server.listen(port, () => {
//   console.log(`Listening on port ${port}`);
// });

const webSocket = new Socket({
  httpServer: server,
  // autoAcceptConnections: true,
});

const users = [];

webSocket.on("request", (req) => {
  console.log("Listening");

  // get origin of request
  // var origin = req.origin + req.resource;

  // accept socket origin
  // const connection = req.accept(null, origin);
  const connection = req.accept();

  connection.on("connection", (stream) => {
    console.log("someone connected!");
  });

  connection.on("message", (message) => {
    console.log("message");
    const data = JSON.parse(message.utf8Data);
    console.log(data);
    const user = findUser(data.name);

    switch (data.type) {
      case "store_user":
        if (user != null) {
          //our user exists
          connection.send(
            JSON.stringify({
              type: "user already exists",
            })
          );
          return;
        }

        // const newUser = data.name;

        const newUser = {
          name: data.name,
          conn: connection,
        };
        users.push(newUser);
        break;

      case "start_call":
        let userToCall = findUser(data.target);

        console.log(userToCall.name);

        if (userToCall) {
          connection.send(
            JSON.stringify({
              type: "call_response",
              data: "user is ready for call",
              target: data.target,
            })
          );
        } else {
          connection.send(
            JSON.stringify({
              type: "call_response",
              data: "user is not online",
            })
          );
        }

        break;

      case "create_offer":
        let userToReceiveOffer = findUser(data.target);

        if (userToReceiveOffer) {
          userToReceiveOffer.conn.send(
            JSON.stringify({
              type: "offer_received",
              target: data.name,
              data: data.data.sdp,
            })
          );
        }
        break;

      case "create_answer":
        let userToReceiveAnswer = findUser(data.target);
        if (userToReceiveAnswer) {
          userToReceiveAnswer.conn.send(
            JSON.stringify({
              type: "answer_received",
              target: data.name,
              data: data.data.sdp,
            })
          );
        }
        break;

      case "ice_candidate":
        let userToReceiveIceCandidate = findUser(data.target);
        if (userToReceiveIceCandidate) {
          userToReceiveIceCandidate.conn.send(
            JSON.stringify({
              type: "ice_candidate",
              target: data.name,
              data: {
                sdpMLineIndex: data.data.sdpMLineIndex,
                sdpMid: data.data.sdpMid,
                sdpCandidate: data.data.sdpCandidate,
              },
            })
          );
        }
        break;
    }
  });

  connection.on("close", () => {
    users.forEach((user) => {
      if (user.conn === connection) {
        users.splice(users.indexOf(user), 1);
      }
    });
  });

  connection.on("error", () => {
    console.log("Error in WebSocket");
  });
});

const findUser = (username) => {
  for (let i = 0; i < users.length; i++) {
    if (users[i].name === username) return users[i];
  }
};

// server.listen(port, () => {
//   console.log(`Listening on port ${port}`);
// });

app.get("/", (req, res) => {
  console.log(`Inside get route`);
});

module.exports = server;

//handle exceptions and exit gracefully
// process.on("unhandledRejection", (reason, promise) => {
//   process.exit(1);
// });
