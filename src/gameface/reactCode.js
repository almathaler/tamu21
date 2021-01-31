'use strict';

const GAME_CHANNEL = "game1";
var numAnswers = 3;
var numPeople = 5;
var myAnswers = [];
var allAnswers = [["Anthony", "Brittany", "Carlos", "Diego", "Elma"],
["English", "PolSci", "ComSci", "Physics", "Math"],
["Read", "Daydream", "Fix bugs", "Suffer", "Think"]];//organized by question, then person
var matches;

if (startReactButtons) {
  initReact();
}

function initReact() {
  setUpPubnub();
  /*numAnswers = parseInt(url.searchParams.get("numQs"));//finds answers to questions
  for (var i = 1; i <= numAnswers; i++) {
    myAnswers.push(url.searchParams.get("q"+i));
    allAnswers.push([]);
  }
  sendAnswers(myAnswers);*/
  window.board.startButtons();
}


function fillMatches() {
  matches = Array(numPeople * numAnswers).fill(null);
  var available = Array(numPeople).fill(null);
  var avail;

  for (var i = 0; i < numAnswers; i++) {//add the numbers all shuffled in rows
    avail = numPeople;
    for (var j = 0; j < avail; j++) {
      available[j] = j;
    }
    for (var j = 0; j < numPeople; j++) {
      var rand = Math.floor(Math.random() * avail);
      matches[i * numPeople + j] = available[rand];
      var hold = available[rand];
      avail--;
      available[rand] = available[avail];
      available[avail] = hold;
    }
  }
}

function interpretMessage(response) {
  var msg = response.message;

  if (msg.type === 'answers') {
    numPeople++;
    for (var i = 0; i < msg.ans.length; i++) {
      allAnswers[i].push(msg.ans[i]);
    }
    console.log(numPeople + ", " + numAnswers);
  } else if (msg.type === 'start' && !isHost) {
    window.board.start(window.board);
  }
}

function setUpPubnub() {

  pubnub.subscribe({//main chat channel
    channels: [GAME_CHANNEL],
    withPresence: false
  });
}

function sendAnswers(answers) {//sends message to chat
  var publishPayload = {
      channel: GAME_CHANNEL,
      message: {
          type: "answers",
          ans: answers
      }
  }
  console.log("sending answers");
  pubnub.publish(publishPayload, function(status, response) {
    if (status.error) {
      console.log(status, response);
    }
  })
}

function sendStart() {
  var publishPayload = {
      channel: GAME_CHANNEL,
      message: {
          type: "start"
      }
  }
  console.log("sending start");
  pubnub.publish(publishPayload, function(status, response) {
    if (status.error) {
      console.log(status, response);
    }
  })
}

class MatchBoard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      info: allAnswers,
      display: "none",
      button_display: "none"
    };

    fillMatches();

    if (startReactButtons) {
      this.state.button_display = "block";
    }
  }

  renderTile(row, col, k) {
    return (
      <Tile
        key={k}
        value={this.state.info[row][matches[row * numPeople + col]]}
        onClick={() => console.log(row + ", " + col)}
      />
    );
  }

  renderRow(row, k) {
    const items = [];
    for (var i = 0; i < numPeople; i++) {
      items.push(this.renderTile(row, i, i+""));
    }
    return (
      <div key={k} className="board_row">
        {items}
      </div>
    );
  }

  render() {
    const items = [];
    for (var i = 0; i < numAnswers; i++) {
      items.push(this.renderRow(i, i+""));
    }

    var element;
    if (isHost) {
      element = <StartButton onClick={() => {
        console.log(3);
        sendStart();
        this.start(this);
      }} display={this.state.button_display}/>;
    } else {
      element = <Waiting display={this.state.button_display}/>;
    }

    return (
      <div className="board_holder">
        <div className="board" style={{display:this.state.display}}>
          {items}
        </div>
        {element}
      </div>
    );
  }

  startButtons() {
    this.state.button_display = "block";
    this.setState({ state: this.state });
  }

  start(self) {
    //fillMatches();
    self.state.display = "block";
    self.state.button_display = "none";
    self.setState({ state: self.state });
  }
}

class Tile extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      bgColor: 'red',
      text: '',
      val: props.value
    };
  }

  handleClick(self) {
    self.state.bgColor = 'white';
    self.state.text = self.state.val;
    this.setState({ state: this.state });
  }

  render() {
    return (
      <button
        className="tile"
        onClick={() => this.handleClick(this)}
        style={{backgroundColor:this.state.bgColor}}>{this.state.text}</button>
    );
  }
}

function StartButton(props) {
  return (
    <button onClick={props.onClick} style={{display:props.display}} id="start_button">Start</button>
  );
}

function Waiting(props) {
  return (
    <h3 style={{display:props.display}}>Waiting for host to start...</h3>
  );
}

const domContainer = document.querySelector('#react_area');

ReactDOM.render(<MatchBoard ref={(board) => {window.board = board}}/>, domContainer);

/*function start() {
  ReactDOM.render(<MatchBoard />, domContainer);
}

if (isHost) {
  ReactDom.render(<StartButton />, domContainer);
} else {
  //ReactDom.render(<Waiting />, domContainer);
}*/
