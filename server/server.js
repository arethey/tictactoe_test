const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(cors());

const PORT = process.env.PORT || 3000;

const initialBoard = Array(9).fill(null);
let players = [];
let currentTurn = null;
let board = [...initialBoard];
let gameInProgress = false;

io.on("connection", (socket) => {
  console.log("A user connected");

  // Add the player to the list
  players.push(socket.id);

  socket.emit("playerConnected", socket.id);

  if (gameInProgress) {
    socket.emit(
      "rejectConnection",
      "Game in progress. Please try again later."
    );
    socket.disconnect(true);
    return;
  }

  if (players.length === 2) {
    gameInProgress = true;
    initializeGame();
  }

  // Notify all clients about the current player list
  io.emit("updatePlayers", players);

  // Listen for player moves
  socket.on("makeMove", (index) => {
    if (socket.id === currentTurn && !board[index]) {
      board[index] = currentTurn === players[0] ? "X" : "O";
      io.emit("updateBoard", board);

      // Check for a winner
      const winner = calculateWinner(board);
      if (winner) {
        io.emit("gameOver", { winner, message: `Player ${winner} wins!` });
        resetGame();
      } else if (!board.includes(null)) {
        // The board is full, declare a draw
        io.emit("gameOver", { winner: "Draw", message: "It's a draw!" });
        resetGame();
      } else {
        // Switch turns
        switchTurn();
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
    players = players.filter((player) => player !== socket.id);
    io.emit("updatePlayers", players);

    // Reset the game if there are no players
    if (players.length === 0) {
      resetGame();
    }
  });
});

function initializeGame() {
  currentTurn = players[Math.floor(Math.random() * 2)];
  io.emit("startGame", {
    currentPlayer: currentTurn,
    board: [...initialBoard],
  });
}

function switchTurn() {
  currentTurn = currentTurn === players[0] ? players[1] : players[0];
  io.emit("switchTurn", currentTurn);
}

function resetGame() {
  players = [];
  currentTurn = null;
  board = [...initialBoard];
  gameInProgress = false;
  io.emit("resetGame");
}

function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }

  return null;
}

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
