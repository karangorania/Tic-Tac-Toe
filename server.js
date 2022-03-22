import { Server } from 'socket.io';
import http from 'http';
const port = 5050;

const server = http.createServer();
const io = new Server(server);

// Object created for socket.id communication players socket.id
let players = { X: null, O: null, turn: 'X', winner: null };

// Server will start running from here
server.listen(port, () => console.log(`server listening on port: ${port}`));

/* Socket.io will start running from here & first player will X also decide here
First player assign to X
 Second player will assign O
*/
io.on('connection', (socket) => {
  if (players.X === null) {
    players.X = socket.id;
    io.sockets.to(players.X).emit('assign', { letter: 'X', msg: '' });
    io.sockets.to(players.X).emit('takeTurn', { player: 'X' }); // First player X will take turn
  } else {
    players.O = socket.id;
    io.sockets
      .to(players.O)
      .emit('assign', { letter: 'O', msg: 'Player X turn' });
  }

  // It will take input value of game from client side to server side
  socket.on('input', (input) => {
    socket.broadcast.emit('attack', {
      value: input.input,
      player: input.player,
    });
  });

  // Give turn to either Player X or O
  socket.on('giveTurn', (input) => {
    if (input.player === 'X') {
      players.turn = 'O';
    } else {
      players.turn = 'X';
    }

    socket.broadcast.emit('takeTurn', { player: players.turn });
  });

  // It will check the winner of the game
  socket.on('endGame', (data) => {
    io.sockets.emit('endGame', { winner: data.winner });
    players.winner = data.winner;
  });

  socket.on('playerLeft', (data) => {
    socket.broadcast.emit('endGame', { winner: data.winner });
  });

  // Disconnect the game if player X or O left the game.
  socket.on('disconnect', () => {
    io.sockets.emit('endGame', {
      winner: 'Oppenent player left',
    });
    players = { X: null, O: null, turn: 'X', winner: null };
  });
});
