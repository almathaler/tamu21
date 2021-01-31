function gameStart(pubnubGuessGame, game, player){
    // Random word will be chosen from the array for player to draw
    const phrases = ['your home state ', 'your major', 'your favorite animal', 'your favorite cartoon', 'your favorite breakfast food', 'your favorite lunch food',
     'your favorite food', 'your favorite fruit'];
    
    let phraseToGuess = '';
    let totalScore = 0;
    let turn =  'H';

    function $(id) { 
        return document.getElementById(id); 
    }   


    let clearCanvasButton = $('clearCanvasButton'), colorSwatch = $('colorSwatch'), 
    guessPhrase = $('guessWord'), switchy = $('switchy'), newWord = $('new-word');

    let gameListener = {
        message: function(msg) {
            if(msg){
                if(turn !== player.sign && msg.message.chosenWord){
                    phraseToGuess = msg.message.chosenWord;
                }

                //only draw on other player's canvas
                if(turn !== player.sign && msg.message.plots){
                    drawFromStream(msg.message);         
                }

                if(msg.message.clearTheCanvas){
                    clearCanvas();
                }
            }    
        },
        //if its like 1 game over idk
        presence: function(response) {
           if(response.action === 'leave'){
            console.log('Player has left the game. You won!');
            unsubscribeFromGame();
           }
        },
        status: function(event) {
            if (event.category == 'PNConnectedCategory') {
                startGame();
            } 
        }     
    }

    pubnubGuessGame.addListener(gameListener);

    pubnubGuessGame.subscribe({
	channels: [game],
        withPresence: true
    });


    function publish(data) {
	pubnubGuessGame.publish({
	     channel: game,
	     message: data
	});
     }

    function unsubscribeFromGame(){
        pubnubGuessGame.removeListener(gameListener);
        // Unsubscribe from game channel
        pubnubGuessGame.unsubscribe({
            channels: [game]
        });
     }

    let canvas = $('drawCanvas');
    let ctx = canvas.getContext('2d');
    let color = document.querySelector(':checked').getAttribute('data-color');

    let isActive = false;
    let plots = [];
    let clearTheCanvas = false;
    let isTouchSupported = 'ontouchstart' in window;

    let isPointerSupported = navigator.pointerEnabled;
    let isMSPointerSupported =  navigator.msPointerEnabled;
    
    let downEvent = isTouchSupported ? 'touchstart' : (isPointerSupported ? 'pointerdown' : (isMSPointerSupported ? 'MSPointerDown' : 'mousedown'));
    let moveEvent = isTouchSupported ? 'touchmove' : (isPointerSupported ? 'pointermove' : (isMSPointerSupported ? 'MSPointerMove' : 'mousemove'));
    let upEvent = isTouchSupported ? 'touchend' : (isPointerSupported ? 'pointerup' : (isMSPointerSupported ? 'MSPointerUp' : 'mouseup'));
    
    function clearCanvas(){
        ctx.fillStyle = 'WHITE';
        ctx.clearRect(0,0,window.innerWidth, window.innerHeight);
        ctx.fillRect(20,20,window.innerWidth, window.innerHeight);     
    }

    function nextRound(){

        clearCanvas();

        // Other players turn to guess the drawing
        if(turn !== player.sign) {
            guessPhrase.innerHTML = `Guess the drawing!`;
            //block the canvas if its not that specific players turn
            canvas.removeEventListener(downEvent, startDraw, false);
            canvas.removeEventListener(moveEvent, draw, false);
            canvas.removeEventListener(upEvent, endDraw, false);    
            clearCanvasButton.removeEventListener('click', clearButton, false);
            //add button so that turn can be switched
            switchy.addEventListener('click', switchTurns, false);
        }

        else{
            guessPhrase.innerHTML = '';
            startGame();            
        }
    }

    function startGame(){
        // Dont generate word if its not ur turn
        if(turn !== player.sign){
            return;
    	}

        let chooseIndex = Math.floor(Math.random() * phrases.length);
        phraseToGuess = phrases[chooseIndex];
        phrases.splice(chooseIndex,1);
        //draw the phrase ur guessing to the html
        guessPhrase.innerHTML = `It's YOUR Turn!!!!!!   Draw: ${phraseToGuess}`;

        publish({
            chosenWord: phraseToGuess
        })            
        
        colorSwatch.addEventListener('click', function() {
            color = document.querySelector(':checked').getAttribute('data-color');
        }, false);

        clearCanvasButton.addEventListener('click', clearButton, false);
        switchy.addEventListener('click', switchTurns, false)
                
        canvas.addEventListener(downEvent, startDraw, false);
        canvas.addEventListener(moveEvent, draw, false);
        canvas.addEventListener(upEvent, endDraw, false);    
    }

   // Draw on other player's canvas
    function drawFromStream(m) {
        if(!m || m.plots.length < 1) return;
	drawOnCanvas(m.color, m.plots);
    }

    function drawOnCanvas(color, plots) {
    	ctx.strokeStyle = color;
	ctx.beginPath();
	ctx.moveTo(plots[0].x, plots[0].y);

    	for(let i=1; i<plots.length; i++) {
	    	ctx.lineTo(plots[i].x, plots[i].y);
	    }
	ctx.stroke();
    }

    function draw(e) {
      // prevent continuous touch event process e.g. scrolling!
	e.preventDefault(); 
	if(!isActive) return;

	let x = isTouchSupported ? (e.targetTouches[0].pageX - canvas.offsetLeft) : (e.offsetX || e.layerX - canvas.offsetLeft);
	let y = isTouchSupported ? (e.targetTouches[0].pageY - canvas.offsetTop) : (e.offsetY || e.layerY - canvas.offsetTop);

	// round numbers for touch screens
	plots.push({x: (x << 0), y: (y << 0)}); 

	drawOnCanvas(color, plots);
    }
	
    function startDraw(e) {
        e.preventDefault();
	isActive = true;
    }
	
    function endDraw(e) {
	e.preventDefault();
        isActive = false;
          
        publish({
            color: color,
            plots: plots,
        })

        plots = [];
     }

    function clearButton(e){
        e.preventDefault();
        clearTheCanvas = true;
        publish({
            clearTheCanvas: clearTheCanvas
        })
    }

    newWord.addEventListener("click", startGame, false);

    let turnCount = 0;

//add a button or something for next turn bc ur playing with friends
    function switchTurns(){
        if(turn=== 'H'){
            turn = 'G';
        }
        else{
            turn = 'G';
            for (let i = 0; i < turnCount; i++) {
                turn += '-';
              }
            turnCount++;

        }
        //add logic so that game ends after every player goes
        nextRound();
    }
}
