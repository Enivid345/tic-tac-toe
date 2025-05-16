const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const { nanoid } = require("nanoid");
const cors = require("cors")

const app = express();
const server = http.createServer(app);
app.use(cors({
  origin: ["https://naxxex-tic-tac-toe.vercel.app"],
  credentials: true,
}));

const io = new Server(server, {
  cors: {
    origin: ["https://naxxex-tic-tac-toe.vercel.app"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});


// Game state
let games = {};
let jID;

app.use(express.static(__dirname));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.use("/style.css", express.static(path.join(__dirname, "style.css")));
app.use(
  "/socket.io",
  express.static(path.join(__dirname, "node_modules/socket.io/client-dist"))
);

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});





io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

    socket.on("createRoom", (playerUserId) => {
        playerUserIdFinal = playerUserId.slice(0, -1); 
        let Role = playerUserId.replace(playerUserIdFinal,"")
      const roomId = nanoid(6);
      games[roomId] = {
          players: [{
              id: socket.id,
              role: Role,
            name: playerUserIdFinal,
              nextPlayer: "",
        }],
        board: Array(9).fill(""),
        turn: Role,
      };
      console.log(games[roomId]);

      socket.join(roomId);
      console.log(`Room ${roomId} created by ${socket.id}`);

      io.to(socket.id).emit("roomCreated", roomId);
    });
  
  
  socket.on("restartGame", (roomId) => {
    game = games[roomId];
    let boardReset = Array(9).fill("");
    if (game) {
      game.board = boardReset
      io.to(roomId).emit("gameUpdate", game);
    }
  });

socket.on("joinRoom", ({ roomId, playerName }) => {
  const game = games[roomId];

  if (!game) {
    io.to(socket.id).emit("roomError", "Room not found.");
    return;
  }

  if (game.players.length >= 2) {
    io.to(socket.id).emit("roomError", "Room is full.");
    return;
  }


  // Check if the player is already in the room
  const existingPlayer = game.players.find((p) => p.id === socket.id);
  if (existingPlayer) {
    io.to(socket.id).emit("roomError", "You are already in this game.");
    return;
  }
 currentRole = game.players[0].role
  // Assign role based on player count
const role = currentRole === "X" ? "O" : "X";
  game.players.push({ id: socket.id, role, name: playerName });
  socket.join(roomId);

  jID = roomId;
  // Notify both players that the game is ready
  if (game.players.length === 2) {
    io.to(roomId).emit("gameUpdate", game);
      let cName = game.players[0].name;
      let jName = game.players[1].name;
      console.log(`${socket.id} joined room ${roomId} as ${role}`);

      io.to(roomId).emit("gameStatus", {
        message: `Player "${jName}" Has Joined The Room`,
        role,
        playerN: cName,
      });
  }
});

 socket.on("makeMove", ({ roomId, index }) => {
   const game = games[roomId];


   if (!game) {

     return;
     }

    if (game.players.length < 2) {
      io.to(socket.id).emit("roomError", "The Other Player Is Not In The Room");
      return;
    }

   let player = game.players.find((p) => p.id === socket.id);
   let otherPlayer = game.players.filter((p) => p.id !== socket.id);
          if (player) {
            console.log(`Player making the move: ${player.name}`);
   }
       console.log("NEXT PERSON " + game.turn);
   console.log(player)
   if (!player) {
     io.to(socket.id).emit("roomError", "You are not in this room.");
     return;
   }

   const { board, turn } = game;

   // Verify it's the player's turn
   if (player.role !== turn) {
     io.to(socket.id).emit("roomError", "It's not your turn!");
     return;
   }

   // Proceed with the move
   if (board[index] === "") {
     board[index] = player.role;
     game.turn = player.role === "X" ? "O" : "X";
     game.nextPlayer = otherPlayer
     io.to(roomId).emit("gameUpdate", game);
     }
     
    console.log(player.name);

 });
  socket.on("updateJoiner", (playerFirst) => {
    io.to(socket.id).emit("playerFirstUpdate", { playerFirst });
  });
socket.on("getPlayerInfo", (roomId) => {
  const game = games[roomId];

  if (!game) {
    io.to(socket.id).emit("playerInfo", { error: "Room not found." });
    return;
  }

  const player = game.players.find((p) => p.id === socket.id);

  if (!player) {
    io.to(socket.id).emit("playerInfo", { error: "You are not in this room." });
    return;
  }

  // Send player info back to the client
  io.to(socket.id).emit("playerInfo", { player });
});

});


server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
