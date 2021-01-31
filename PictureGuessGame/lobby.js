//CREDIT TO https://github.com/ocastroa/GuessWordPubNub (went through and made small edits and folllowed tutorial)
(function() {
    //set the main settings for each player--which are identified by the name and the
    //sign
    const player = {
        name: '',
        sign: '',
    }


    function $(id) { 
        return document.getElementById(id); 
    }   

    //set the html elements!
    let topWritingOnPage = $('guessWord');

    // set the pubnub channels
    let waitingRoom = prompt("Enter game code, If you are a new user create a gamecode and share with your friends");
    let game = waitingRoom; 
    waitingRoom = waitingRoom + 'Waitroom'; // separate channel for the waiting room
    //this is so it doesnt get intertwined?
    //each needs a unique ID i think
    const newUUID = PubNub.generateUUID();
    let isHost = false;
    let guestName = 'Guess';

    //Create the main game
    const drawingGame = new PubNub({
        uuid: newUUID,
        publish_key: 'pub-c-e8a09e28-2bca-4385-9fec-e868caa0976a',
        subscribe_key: 'sub-c-574c085a-6331-11eb-bda1-0e29543bebe5',
        ssl: true
    });

    let listener = {
        presence: function(response) {
            //when someone joins the game
            if (response.action === 'join') {
                if(response.occupancy < 2){
                    // Check that game lobby is not full
                    drawingGame.hereNow({
                        //here create the channel
                        channels: [game]
                    }, function (status, response) {
                            // Unsubscribe if the game is full
                            //SEt the max to 10 people
                            //TEST

                            if (response.totalOccupancy >= 10) {
                                topWritingOnPage.innerHTML = '';
                                window.alert("This game is full! Try again later");
                                drawingGame.removeListener(listener);
                                drawingGame.unsubscribe({
                                    //bye!
                                    channels: [waitingRoom]
                                });
                                return;
                            }
                        }); 
                    // First player should be the host
                    player.name = 'Host';
                    player.sign = 'H';
                    
                    isHost = true;
                    topWritingOnPage.innerHTML = 'It is your turn. Currently waiting for more users...';
                }                    

                else if(response.occupancy>=2){
                    // Player is the Guest
                    if(!isHost){
                        player.name = guestName;
                        player.sign = 'G';
                        topWritingOnPage.innerHTML = `Guess the drawing!`;
                    }

                    guestName = guestName + '-';
                    
                    gameStart(drawingGame, game, player);               
                }
            }
        }, 
        status: function(event) {
            if (event.category == 'PNConnectedCategory') {
                setUpCanvas();
            } 
        }   
    }
    drawingGame.addListener(listener);

    drawingGame.subscribe({
        channels: [waitingRoom],
        withPresence: true
    });

    //Setting up the canvas to be used
    let canvas = document.getElementById('drawCanvas');
    let ctx = canvas.getContext('2d');
    let color = document.querySelector(':checked').getAttribute('data-color');

    function setUpCanvas(){
        ctx.fillStyle = 'WHITE';
        ctx.fillRect(20,20,window.innerWidth, window.innerHeight);
        ctx.strokeStyle = color;
        ctx.lineWidth = '4';
        ctx.lineCap = ctx.lineJoin = 'round';        
    }
})();
   
  
