import chalk from 'chalk';
import figlet from 'figlet';

import socketIOClient from 'socket.io-client';
import inquirer from 'inquirer';

const socket = socketIOClient('http://127.0.0.1:5050');

socket.on('connect', () => {
  console.log(chalk.green('connected to 127.0.0.1 5050'));
  console.log(chalk.red('=== start game ==='));
});

socket.on('disconnect', () => {
  socket.emit('disconnect');
});

// It will assign letter to a Player X or O
socket.on('assign', (assign) => {
  console.log('You are player ' + assign.letter);
  console.log(assign.msg);
});

socket.on('takeTurn', (data) => {
  startGame(data.player);
});
socket.on('attack', (value) => {
  markBoard(value.value, value.player);
  printBoard();
});

socket.on('endGame', (data) => {
  console.log(data.winner);
});

console.log(
  chalk.yellow(figlet.textSync('Tic-Tac-Toe', { horizontalLayout: 'full' }))
);

//Object will track the state of the game

const board = {
  1: ' ',
  2: ' ',
  3: ' ',
  4: ' ',
  5: ' ',
  6: ' ',
  7: ' ',
  8: ' ',
  9: ' ',
};

// Winning condition of Tic Tac Toe game.

const winningCondition = [
  [1, 2, 3], //horizontal
  [4, 5, 6], //horizontal
  [7, 8, 9], //horizontal
  [1, 4, 7], //vertical
  [2, 5, 8], //vertical
  [3, 6, 9], //vertical
  [1, 5, 9], //cross
  [3, 5, 7], //cross
];

//Mark the indicated position with the indicated letter
const markBoard = (position, letter) => {
  board[position] = letter.toUpperCase();
};

//Output the board to the console
const printBoard = () => {
  console.log('                                         ');
  console.log(
    ' ---------\n' +
      ' ' +
      board[1] +
      ' | ' +
      board[2] +
      ' | ' +
      board[3] +
      '\n' +
      ' ---------\n' +
      ' ' +
      board[4] +
      ' | ' +
      board[5] +
      ' | ' +
      board[6] +
      '\n' +
      ' ---------\n' +
      ' ' +
      board[7] +
      ' | ' +
      board[8] +
      ' | ' +
      board[9] +
      '\n' +
      ' ---------\n'
  );
};

//validInput will check to see the given input is not already taken by another player on the board.
const validInput = (position) => {
  if (board[position] === ' ') {
    return true;
  } else {
    return false;
  }
};

// It will select a winner by using the win condition matrix to check if any of the subarrays contain the same number of X's or O's.
const selectWinnner = (player) => {
  let count = 0;
  for (let i = 0; i < winningCondition.length; i++) {
    count = 0;
    for (let j = 0; j < winningCondition[i].length; j++) {
      if (board[winningCondition[i][j]] === player) {
        count++;
      }
      if (count === 3) {
        return true;
      }
    }
  }
  return false;
};

//Check to see if the game ends in a draw by verifying all the tiles are filled. This function is only ever called after selectWinnner to guarantee it will not be looking at a board state that contains a winning condition.

// It will check for draw by verifying all the tiles are filled, then it will execute the game is draw.
const selectDraw = () => {
  for (const tile in board) {
    if (board[tile] === ' ') {
      return false;
    }
  }
  return true;
};

//Runs the game by prompting the players for their input and calling the rest of the game controlling functions. The Inquirer package provides input validation to ensure that players enter only numbers 1-9.

const startGame = (player) => {
  inquirer
    .prompt([
      {
        name: 'playerMove',
        // type: 'number',
        type: 'string',
        message: 'Player ' + player + ': enter a number 1-9',
        validate: (value) => {
          if (
            value === '1' ||
            value === '2' ||
            value === '3' ||
            value === '4' ||
            value === '5' ||
            value === '6' ||
            value === '7' ||
            value === '8' ||
            value === '9'
          ) {
            if (validInput(parseInt(value))) {
              // Here we have use parseInt to convert string to int
              socket.emit('input', { input: value, player: player });
              return true;
            } else {
              return 'Select an empty place ';
            }
          } else {
            if (value === 'r') {
              // we have taken 'r' value for resing the game
              socket.emit('playerLeft', { winner: ' Opponent left You Wins!' });
              return 'You left !';
            }
            return 'Enter a number';
          }
        },
      },
    ])
    .then((response) => {
      markBoard(response.playerMove, player);
      printBoard();
      if (selectWinnner(player)) {
        socket.emit('endGame', { winner: `${player} wins!` });
        return;
      }
      if (selectDraw()) {
        socket.emit('endGame', { winner: 'Game is a draw.' });
        return;
      }

      socket.emit('giveTurn', { player: player });
    });
};
