const CHAT_CHANNEL = "chat_test5";
const CONTROL_CHANNEL = "control_test5";
const UUID_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const numPlayersText = document.getElementById("numPlayers");
var messagesTop = document.getElementById("last_message");

var playerNum = 0;
var isHost = false;
var playerName;
var numPlayers = 0;

var url_string = window.location.href;
var url = new URL(url_string);


function checkIfStarted() {//returns false if doesn't match last game, or no name
  var ret = true;
  var lastGame = localStorage.getItem('lastGame');

  if (lastGame === null || lastGame !== url.searchParams.get("game")) {
    ret = false;
  }

  playerName = localStorage.getItem('chat_name');
  if (playerName === null) {
    ret = false;
  }

  return ret;
}

function removeJoin() {//removes the join area, if already joined
  var enterNameArea = document.getElementById("enterName");
  enterNameArea.remove();
}

function init() {
  if (checkIfStarted()) {
    removeJoin();
    joinChat();
    alert(playerName + " has joined the room");//wont already have alert
    pubnub.hereNow({
      channels: [CHAT_CHANNEL]
    }, function (status, response) {
      numPlayers = response.totalOccupancy;
      updateNumPLayers();
    });
  }
}

function findUUID() {//checks if comp already has uuid
  var uuid = localStorage.getItem('chat_uuid');
  if (uuid === null) {
    uuid = randString(32);
    localStorage.setItem('chat_uuid', uuid);
  }
  return uuid;
}

function joinButton(nameInput) {
    if (nameInput.value === "")
      return;

    playerName = nameInput.value;
    localStorage.setItem('lastGame', url.searchParams.get("game"));//sets current game, now that started
    localStorage.setItem('chat_name', playerName);
    nameInput.value = "";

    joinChat();
}

function joinChat() {
  pubnub = new PubNub({
      publishKey : "pub-c-8a3ef9c7-adec-4424-abbd-42f099243469",
      subscribeKey : "sub-c-16588e62-6341-11eb-8d92-92d9cc8397ac",
      uuid: findUUID()
  })

  pubnub.addListener({
      status: function(statusEvent) {
          if (statusEvent.category === "PNConnectedCategory") {
            pubnub.hereNow({
              channels: [CHAT_CHANNEL],
              includeState: true
            }, function (status, response) {
              console.log(status, response);
            });
          }
      },
      presence: function(response) {//assigns player numbers and host
          if (response.action === 'join') {
            if (playerNum === 0) {//first time joining
              if (response.occupancy < 2) {//first in room
                isHost = true;
                playerNum = 1;
              } else {
                  playerNum = response.occupancy;
              }
                alert(playerName + " has joined the room");
            }
          }

          numPlayers = response.occupancy;
          updateNumPLayers();
      },
      message: function(response) {//interprets the messages
        let msg = response.message;

        if (msg.type === 'unsubscribe') {
          pubnub.unsubscribe({
            channel: msg.channel
          });
        } else if (msg.type === 'unsubscribe-all') {
          pubnub.unsubscribeAll();
        } else if (msg.type === "sent_message") {
          printMessage(msg);
        } else if (msg.type === "alert_message") {
          printAlertMessage(msg);
        }
      }
  })

  pubnub.subscribe({//main chat channel
    channels: [CHAT_CHANNEL],
    withPresence: true,
  });

  pubnub.subscribe({//forces users to unsubscribe
    channels: [CONTROL_CHANNEL]
  });
}

function sendMessageButton(msgInput) {//called by the button to send message
    sendMessage(msgInput.value);
    msgInput.value = "";
}

function sendMessage(msg) {//sends message to chat
  var publishPayload = {
      channel: CHAT_CHANNEL,
      message: {
          type: "sent_message",
          sender: playerName,
          content: msg
      }
  }
  pubnub.publish(publishPayload, function(status, response) {
    if (status.error) {
      console.log(status, response);
    }
  })
}

function updateNumPLayers() {
  numPlayersText.innerHTML = "Number of players: " + numPlayers;
}

function alert(msg) {
  var publishPayload = {
      channel: CHAT_CHANNEL,
      message: {
          type: "alert_message",
          content: msg
      }
  }
  pubnub.publish(publishPayload, function(status, response) {
    if (status.error) {
      console.log(status, response);
    }
  })
}

function printMessage(msg) {//prints message to stream
  var pmessage = document.createElement("p");
  messagesTop.before(pmessage);

  var bold = document.createElement("b");
  bold.appendChild(document.createTextNode(msg.sender))
  pmessage.appendChild(bold);

  pmessage.appendChild(document.createElement("br"));
  pmessage.appendChild(document.createTextNode(msg.content));

  messagesTop = pmessage;
}

function printAlertMessage(msg) {//prints message to stream
  var pmessage = document.createElement("p");
  messagesTop.before(pmessage);

  var bold = document.createElement("i");
  bold.appendChild(document.createTextNode(msg.content))
  pmessage.appendChild(bold);

  messagesTop = pmessage;
}

function randString(len) {//creates rand string of alphabet chars of length len
  var ret = "";
  for (var i = 0; i < len; i++) {
    ret += UUID_CHARS.charAt(Math.floor(UUID_CHARS.length * Math.random()));
  }
  return ret;
}

function leave() {//unsubscribes all

  pubnub.publish({
    channel: CONTROL_CHANNEL,
    message: {
      type: "unsubscribe-all"
    }
  });
}

init();
