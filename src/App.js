import React from 'react';
import './index.css';

function Square(props) {
  return (
    <button className="square" onClick={props.onClick}>
      {props.value}
    </button>
  );
}

class Board extends React.Component {
  renderSquare(i) {
    return (
      <Square
        value={this.props.squares[i]}
        onClick={() => this.props.onClick(i)}
      />
    );
  }

  render() {
    return (
      <div>
        <div className="board-row">
          {this.renderSquare(0)}
          {this.renderSquare(1)}
          {this.renderSquare(2)}
        </div>
        <div className="board-row">
          {this.renderSquare(3)}
          {this.renderSquare(4)}
          {this.renderSquare(5)}
        </div>
        <div className="board-row">
          {this.renderSquare(6)}
          {this.renderSquare(7)}
          {this.renderSquare(8)}
        </div>
      </div>
    );
  }
}

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      history: [{
        squares: Array(9).fill(null)
      }],
      xIsNext: true
    };
  }

  handleClick(i) {
    const history = this.state.history;
    const current = history[history.length - 1];
    const squares = current.squares.slice();
    if (!this.state.xIsNext || calculateWinner(squares) || history.length > 9 || squares[i]) {
      return;
    }
    this.makeMove(i);
  }
  
  makeMove(i) {
    const history = this.state.history;
    const current = history[history.length - 1];
    const squares = current.squares.slice();
    squares[i] = this.state.xIsNext ? 'X' : 'O';
    this.setState({
      history: history.concat([{
        squares: squares
      }]),
      xIsNext: !this.state.xIsNext,
    });
  }
  
  componentDidUpdate () {
    // make an AI move after half a second
    if (!this.state.xIsNext) {
        const history = this.state.history;
        const current = history[history.length - 1];
        const squares = current.squares.slice();
        const move = strategy(squares, this.state.xIsNext);
        const that = this;
        setTimeout(function() {that.makeMove(move);}, 700);
    };
  }
  
  render() {
    const history = this.state.history;
    const current = history[history.length - 1];
    const winner = calculateWinner(current.squares);
    //console.log(getChildStates(current.squares, this.state.xIsNext));
    
    let status;
    if (winner) {
      status = 'Winner: ' + winner;
    } else if (history.length > 9) { 
      status = "Game Tied!";
    } else if (this.state.xIsNext) {
      status = 'It\'s your turn.';
    } else {
      status = "AI is thinking..."
    }

    return (
        <div className="game">
            <div className="game-info">
                <h1>{status}</h1>
                <div className="game-row">
                    <div className="game-board">
                        <Board
                            squares={current.squares}
                            onClick={(i) => this.handleClick(i)}
                        />
                    </div>
                    <table className="player-info">
                        <tbody>
                            <tr>
                                <td>You :</td>
                                <td>X</td>
                            </tr>
                            <tr>
                                <td>AI :</td>
                                <td>O</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p>
                    <button onClick = { () => this.restart()}>Restart</button>
                </p>
            </div>
        </div>
    );
  }
  
  restart(){
    this.setState({
      history: [{
        squares: Array(9).fill(null)
      }],
      xIsNext: Math.random() > 0.5
    });
  }
                
}

// ========================================

// ReactDOM.render(
//   <App />,
//   document.getElementById('root')
// );

// helper functions for calculating computer's move
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

function getScore(squares) {
    // return an array of 2 elements [isGameEnded, score]
    // isGameEnded indicates if the game has finished
    // score is 10 if "X" wins, -10 if "O" wins, and 0 otherwise
    const winner = calculateWinner(squares);
    if (winner) {
        return [true, winner === "X" ? 10 : -10];
    } else if (!squares.includes(null)) {
        return [true, 0];
    } else {
        return [false, 0];
    }
}

function getChildStates(squares, xIsNext) {
    let result = [];
    for (let i = 0; i < 9; i++) {
        if (squares[i] == null) {
            let newSquares = squares.slice();
            newSquares[i] = xIsNext ? "X" : "O";
            result.push([newSquares, i]);
        }
    }
    return result;
}

function minimize(squares) {
    let score = getScore(squares);
    if (score[0]) {
        // the game has ended
        return [null, null, score[1]];
    }
    const MAX_UTIL = 100;
    //const MIN_UTIL = -100;
    let [min_child, min_move, min_utility] = [null, null, MAX_UTIL];
    const nextStates = getChildStates(squares, false);
    for (let i = 0; i < nextStates.length; i++) {
        let utility = maximize(nextStates[i][0]);
        if (utility[2] < min_utility || (utility[2] === min_utility && Math.random() > 0.5)) {
            [min_child, min_move, min_utility] = [nextStates[i][0], nextStates[i][1], utility[2]];
        }
    }
    return [min_child, min_move, min_utility];
}

function maximize(squares) {
    let score = getScore(squares);
    if (score[0]) {
        // the game has ended
        return [null, null, score[1]];
    }
    //const MAX_UTIL = 100;
    const MIN_UTIL = -100;
    let [max_child, max_move, max_utility] = [null, null, MIN_UTIL];
    const nextStates = getChildStates(squares, true);
    for (let i = 0; i < nextStates.length; i++) {
        let utility = minimize(nextStates[i][0]);
        if (utility[2] > max_utility || (utility[2] === max_utility && Math.random() > 0.5)) {
            [max_child, max_move, max_utility] = [nextStates[i][0], nextStates[i][1], utility[2]];
        }
    }
    return [max_child, max_move, max_utility];
}

function strategy(squares, xIsNext) {
    return xIsNext ? maximize(squares)[1] : minimize(squares)[1];
}

export default App;


