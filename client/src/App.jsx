import React, { useState, useEffect } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:3000", {
  transports: ["websocket"], // Use WebSocket as the transport method
  withCredentials: true, // Pass credentials (if needed)
});

function App() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [playerInfo, setPlayerInfo] = useState(null);

  useEffect(() => {
    socket.on("playerConnected", (playerId) => {
      setPlayerInfo(playerId);
    });

    socket.on("rejectConnection", (message) => {
      alert(message);
    });

    socket.on("startGame", ({ currentPlayer, board }) => {
      setBoard(board);
      setCurrentPlayer(currentPlayer);
      setGameOver(false);
    });

    socket.on("switchTurn", (nextPlayer) => {
      setCurrentPlayer(nextPlayer);
    });

    socket.on("updateBoard", (newBoard) => {
      setBoard(newBoard);
    });

    socket.on("updatePlayers", (newPlayers) => {
      setPlayers(newPlayers);
    });

    socket.on("resetGame", () => {
      setBoard(Array(9).fill(null));
      setCurrentPlayer(null);
      setPlayers([]);
      setPlayerInfo(null);
      setGameOver(false);
    });

    socket.on("gameOver", ({ winner, message }) => {
      setGameOver(true);
      alert(message);
    });
  }, []);

  const handleClick = (index) => {
    if (currentPlayer && !gameOver) {
      socket.emit("makeMove", index);
    }
  };

  const renderSquare = (index) => (
    <button className="square" onClick={() => handleClick(index)}>
      {board[index]}
    </button>
  );

  return (
    <div className="game">
      <div className="game-board">
        <div className="board-row">
          {renderSquare(0)}
          {renderSquare(1)}
          {renderSquare(2)}
        </div>
        <div className="board-row">
          {renderSquare(3)}
          {renderSquare(4)}
          {renderSquare(5)}
        </div>
        <div className="board-row">
          {renderSquare(6)}
          {renderSquare(7)}
          {renderSquare(8)}
        </div>
      </div>
      <div className="game-info">
        <div>Player Info: {playerInfo}</div>
        <br />
        <div>{`Current Player: ${
          currentPlayer || "Waiting for players..."
        }`}</div>
        <div>{`Players: ${players.join(", ")}`}</div>
        {gameOver && <div>Game Over</div>}
      </div>
    </div>
  );
}

export default App;
