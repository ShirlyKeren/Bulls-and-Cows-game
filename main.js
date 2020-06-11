const initialState = Immutable.fromJS({
  guesses: [],
  currentGuess: [' ', ' ', ' ', ' '],
  focusedDigit: 0,
  secret: '6812',  
});

function setDigit(state, val) {
  const guessSize = state.get('currentGuess').size;
  const idx = state.get('focusedDigit');
  
  return state.update('currentGuess', (arr) => arr.set(idx, val)).
  update('focusedDigit', (n) => (n+1)%guessSize);
}

function setFocus(state, index) {
  return state.set('focusedDigit', index);
}

function play(state) {
  return state.update('guesses', (guesses) => guesses.unshift(state.get('currentGuess').join(''))).
  set('currentGuess', initialState.get('currentGuess')).
  set('focusedDigit', 0);
}

const actions = {
  setDigit: (val) => ({ type: '@@setDigit', payload: { val }}),
  setFocus: (idx) => ({ type: '@@setFocus', payload: idx }),
  play:     ()    => ({ type: '@@play' }),
  newGame:  ()    => ({ type: '@@newGame' }),
};

function reducer(state = initialState, action) {
  switch(action.type) {
    case '@@setDigit': 
      return setDigit(state, action.payload.val);

    case '@@play':
      return play(state);

    case '@@newGame':
      return initialState;
      
    case '@@setFocus':
      return setFocus(state, action.payload);
      
    default:
      return state;
  }
}

function mapStateToProps(state) {
  return {
    guesses: state.get('guesses'),
    currentGuess: state.get('currentGuess'),
    focusedDigit: state.get('focusedDigit'),
    numRounds: state.get('numRounds'),
    secret: state.get('secret'),
  };
}

const connect = ReactRedux.connect;
const Provider = ReactRedux.Provider;
const store = Redux.createStore(reducer);

const InputPanel = React.createClass({
  
  handleKeyPress(e) {
    const ch = String.fromCharCode(e.charCode);
    if (!!Number(ch)) {
      this.props.dispatch(actions.setDigit(ch));
    }    
  },
  
  handleKeyDown(e) {
    const code = e.keyCode;
    const currFocus = this.props.focusedDigit;
    
    if (code === 37 || code === 8) {
      // left arrow      
      this.props.dispatch(actions.setFocus((currFocus - 1) % 4));
      e.preventDefault();      
    } else if (code === 39) {
     // right arrow 
      this.props.dispatch(actions.setFocus((currFocus + 1) % 4));
    } else if (code === 13) {
      this.props.dispatch(actions.play());
    }
  },
  
  componentDidUpdate() {
    const digits = this.refs.el.querySelectorAll('.digit');
    digits[this.props.focusedDigit].focus();
  },
  
  render() {
    const { dispatch, currentGuess } = this.props;
    
    return (<div ref="el">
      {currentGuess.map((d,i) => (
        <div onKeyPress={this.handleKeyPress} 
          onKeyDown={this.handleKeyDown}
          tabIndex={1}           
          onFocus={(e) => dispatch(actions.setFocus(i))}
          className="digit" 
          key={i}>{d}</div>
      ))}   
      </div>);
  }
});

class BPGame {
  constructor(secret) {
    this.secret = _.object(String(secret).split('').map((d, i) => [d, i]));
    this.secretValue = secret;
  }
  
  isWinner(guess) {
    return String(guess) === String(this.secretValue);
  }
  
  getStyleFor(guess, digit) {    
    const secretIndex = this.secret[guess.charAt(digit)];
    if ( secretIndex === digit ) {
      return { background: 'green' };
    } else if ( typeof secretIndex !== 'undefined' ) {
      return { background: 'yellow' };
    } else {
      return {};
    }
  }
}

var App = connect(mapStateToProps)(function(props) {
  const game = new BPGame(props.secret);
  
  return (<div className="main">      
      {game.isWinner(props.guesses.first()) ? 
        <div>
          {props.secret.split('').map((d, i) => (
          <div className="digit" style={{background: 'green'}}>{d}</div>
          ))}
        </div>
        :
        <div>
        <div className="digit">?</div>
        <div className="digit">?</div>
        <div className="digit">?</div>
        <div className="digit">?</div>      
      </div>
      }
      <button onClick={() => props.dispatch(actions.newGame())}>Restart</button>
      <hr />
      <div className="currentGuess" refs="currentGuess">
        <InputPanel 
          currentGuess={props.currentGuess} 
          focusedDigit={props.focusedDigit}
          dispatch={props.dispatch} />
        <button onClick={() => props.dispatch(actions.play())}>Check</button>
      </div>
      <hr />
      <div className="pastGuesses">
        {props.guesses.map((guess, idx) => (
          <div className="row" key={idx}>
            {guess.split('').map((d, j) => (
              <div className="digit" key={j} style={game.getStyleFor(guess, j)}>{d}</div>
            ))}
          </div>
        ))}
      </div>
      </div>);
});

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>, document.querySelector('main'));