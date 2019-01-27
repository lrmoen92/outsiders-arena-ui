import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Character, Battle, Player } from 'src/app/model/api-models';
@Component({
  selector: 'arena-root',
  templateUrl: './arena.component.html',
  styleUrls: ['./arena.component.css']
})
export class ArenaComponent implements OnInit {
	title : string = 'outsiders-arena-ui';
	prefixHttp : string = 'http://';
	prefixWs : string = 'ws://';
	domain : string = 'localhost:8817/';
	apiUrl : string = this.prefixHttp + this.domain;
	wsUrl : string = this.prefixWs + this.domain;
	characterUrl : string = 'api/character/';
	playerUrl : string = 'api/player/';
	arenaUrl : string = 'api/player/arena/';
	arenaWs : string = 'arena/';
	connected : Boolean = false;
	battleCharacters : Array<Character> = [];
	battle : Battle;
	isPlayerOne : Boolean;
	webSocket : WebSocket = null;
	httpClient : HttpClient;
	playerId : Number;
	player : Player;
	arenaId : Number;
	opponentName : string;
	playerName : string;
	playerAvatarUrl : string;
	finishButton_disabled : Boolean = false;
	tradeButton_disabled : Boolean = true;
	finishButton_hidden : Boolean = false;
	tradeButton_hidden : Boolean = true;
	createPlayerButton_disabled : Boolean = false;
	playerBattleInfo_hidden : Boolean = false;
	showAbilitiesFlag : Boolean;
	strSpend : Number;
	dexSpend : Number;
	arcSpend : Number;
	divSpend : Number;
	loggedIn : Boolean = false;


  constructor(httpClient : HttpClient) {
    this.httpClient = httpClient;
  }

  ngOnInit() {
    if (this.webSocket != null) {
    	this.disconnect();
    }

    this.httpClient.get(this.apiUrl + this.characterUrl).subscribe(
      x => {
        console.log(x);
        this.battleCharacters = <any[]> x;
      },
      y => {

      },
      () => {

      }
    );
  }

  // START OF SLATE

// find battle -- OPEN SOCKET

findBattle(playerName : string) {
	if (playerName) {
		this.connectByPlayerName(playerName);
		// disable button
	} else {
		alert("You must enter an opponent's display name.")
	}
}

// Login OR Create User if does not exist.
// TODO: make this a real login
sendConnectRequest() {
  console.log(':::Logging in...');
	let disp = this.playerName || "NPC";
	let aurl = this.playerAvatarUrl || "https://i.imgur.com/sdOs51i.jpg";
	let req = {
			"displayName": disp,
			"avatarUrl": aurl
  };
  let url = this.apiUrl + this.playerUrl;
  this.httpClient.post(url, req).subscribe(
    x => {
      console.log(':::Response ');
      console.log(x);
      let player : Player = <Player> x;
      this.playerId = player.id
	  this.player = player;
	  this.loggedIn = true;
    },
    y => {

    },
    () => {
      console.log("Player logged in");
    }
  )
}

// find the player you'd like to play with, and get their arenaID, or find no player and get your own (and enter matchmaking)
connectByPlayerName(name : string) {
  console.log(':::Connecting to...');
  console.log(name);
  let url = this.apiUrl + this.arenaUrl + this.playerId + "/" + name;
  this.httpClient.get(url).subscribe(
    x => {
      console.log(':::Arena Id');
      console.log(x);
      this.arenaId = <Number> x;
      this.connectByArenaId();
    },
    y => {

    },
    () => {

    }
  );
}

// simply connect to one "arena", aka one websocket using ArenaID
connectByArenaId() {
	this.webSocket = new WebSocket(this.wsUrl + this.arenaWs + this.arenaId);
	this.handleMessage();
	setTimeout(this.sendMatchMakingMessage, 1000);
}

// (this is a send message but it made more sense to put it above)
sendMatchMakingMessage() {
	const chars = [0, 1, 2]; // Indiv. character select.  TODO
	let playerId = this.playerId;
	let arenaId = this.arenaId;
	console.log("PlayerID: " + playerId);
	console.log("Chars: " + chars);
	console.log("ArenaID: " + arenaId);
	let msg = {
		type: "MATCH_MAKING",
		char1: chars[0],
		char2: chars[1],
		char3: chars[2],
		playerId: playerId,
		arenaId: arenaId,
		opponentName: 'Opponent Name' // TODO 
	};
	this.webSocket.send(JSON.stringify(msg));
}

// ------ HANDLE MESSAGES
// this method gets called once WS is created to initiate the message routing logic
handleMessage() {

  this.webSocket.onmessage = response => {
    let msg = JSON.parse(response.data);
		let mtp = msg.type;
		console.log(msg);
		if (mtp === "INIT") {
			this.handleInit(msg);
		} else if (mtp === "CCHECK") {
			this.handleCostCheck(msg);
		} else if (mtp === "TCHECK") {
			this.handleTargetCheck(msg);
		} else if (mtp === "ETRADE") {
			this.handleEnergyTrade(msg);
		} else if (mtp === "END") {
			this.handleTurnEnd(msg);
		} else {
			if (msg !== "WAITING FOR OPPONENTS"){
				console.log("UNRECOGNIZED");
			}
		}
  }

}

/// INIT BLOCK

handleInit(msg) {
	
	this.battleCharacters = msg.characters;
	this.isPlayerOne = msg.battle.playerIdOne === this.playerId;

	if (this.isPlayerOne){
		
		// handlePortraits(msg.characters.slice(0, 3), msg.characters.slice(3, 6));
		// initEnergy(formatEnergy(msg.battle.playerOneEnergy));
		// handleEnemyInfo(msg.playerTwo);
	} else {
    // handle portraits, init energy, init enemy info TODO
		// handlePortraits(msg.characters.slice(3, 6), msg.characters.slice(0, 3));
		// initEnergy(formatEnergy(msg.battle.playerTwoEnergy));
		// handleEnemyInfo(msg.playerOne);
	}
	// HOOO OOOOOOO OOOO BOYYY
	this.initTheRest(msg);
}

initTheRest(msg){
	// figures out which finishButton to disable first the rest is handled elsewhere (hence the INIT)
	// if you're player one and you have more than one energy, you go second so disable them
	if (this.isPlayerOne && msg.battle.playerOneEnergy.length > 1) {
		this.finishButton_disabled = true;
		this.tradeButton_disabled = true;
		this.hideAbilities();
	}
	if (!this.isPlayerOne && msg.battle.playerTwoEnergy.length > 1) {
		this.finishButton_disabled = true;
		this.tradeButton_disabled = true;
		this.hideAbilities();
	}
	// show movediv
	// init the chat	
}

hideAbilities() {
	this.showAbilitiesFlag = false;
}

showAbilities() {
  this.showAbilitiesFlag = true;
}

handleEnergy = energyMap => {

  // HANDLE ALL ENERGY WITH THIS METHOD      TODO
	// remove all energy

	// let strT = parseInt(document.getElementById("strengthTotal").textContent);
	// let dexT = parseInt(document.getElementById("dexterityTotal").textContent);
	// let arcT = parseInt(document.getElementById("arcanaTotal").textContent);
	// let divT = parseInt(document.getElementById("divinityTotal").textContent);

	// const energyTotals = {
	// 	STRENGTH: strT,
	// 	DEXTERITY: dexT,
	// 	ARCANA: arcT,
	// 	DIVINITY: divT
	// }

	// this.removeEnergy(energyTotals);
	
	// // honor energyMap as being the correct source of energy
	// for (let key in energyMap){
	// 	for (let i = 0; i < energyMap[key]; i++){
	// 		const energyBubble = document.createElement("div");
	// 		energyBubble.style.height = "10px";
	// 		energyBubble.style.width = "10px";
	// 		energyBubble.style.border = "1px solid black";
	// 		energyBubble.style.marginRight = "5px";
	// 		energyBubble.className = key.toLowerCase() + "Bubble";
	// 		let substr = key.toLowerCase() + "Total";
	// 		let x = document.getElementById(substr);
	// 		x.textContent = parseInt(x.textContent) + 1;
	// 		if (key === "STRENGTH") {
	// 			energyBubble.style.backgroundColor = "red"
	// 		} else if (key === "DEXTERITY") {
	// 			energyBubble.style.backgroundColor = "green"
	// 		} else if (key === "ARCANA") {
	// 			energyBubble.style.backgroundColor = "blue"
	// 		} else if (key === "DIVINITY") {
	// 			energyBubble.style.backgroundColor = "white";
	// 		}
	// 		document.getElementById(key.toLowerCase()).appendChild(energyBubble);
	// 	}
	// }
}

// only used to put energy back individually (rare case)

addEnergy = (energyMap) => {
//  add energy icons and update totals TODO
  
	// for (let key in energyMap){
	// 	for (let i = 0; i < energyMap[key]; i++){
	// 		const energyBubble = document.createElement("div");
	// 		energyBubble.style.height = "10px";
	// 		energyBubble.style.width = "10px";
	// 		energyBubble.style.border = "1px solid black";
	// 		energyBubble.style.marginRight = "5px";
	// 		energyBubble.className = key.toLowerCase() + "Bubble";
	// 		let substr = key.toLowerCase() + "Total";
	// 		let x = document.getElementById(substr);
	// 		x.textContent = parseInt(x.textContent) + 1;
	// 		if (key === "STRENGTH") {
	// 			energyBubble.style.backgroundColor = "red"
	// 		} else if (key === "DEXTERITY") {
	// 			energyBubble.style.backgroundColor = "green"
	// 		} else if (key === "ARCANA") {
	// 			energyBubble.style.backgroundColor = "blue"
	// 		} else if (key === "DIVINITY") {
	// 			energyBubble.style.backgroundColor = "white";
	// 		}
	// 		document.getElementById(key.toLowerCase()).appendChild(energyBubble);
	// 	}
	// }
}

removeEnergy = (spentEnergy) => {

	// remove energy from totals, and icons
}

// TODO this is needed for the inital energy map because i'm dumb?  look into fixing this nonsense later
handleAndFormatEnergy = (playerEnergy) => {
	this.handleEnergy(this.formatEnergy(playerEnergy));
}

formatEnergy = energy => {
	const energyTotal = {
		STRENGTH: 0,
		DEXTERITY: 0,
		ARCANA: 0,
		DIVINITY: 0
	};

	for (let entry of energy){
		energyTotal[entry]++;
	}
	return energyTotal;
}

clearSpent() {
	this.strSpend = 0;
	this.dexSpend = 0;
	this.arcSpend = 0;
	this.divSpend = 0;
}

// --- END INIT BLOCK


// ------ SEND MESSAGES

// TODO
// gotta do this any time they assign one target/ability too!
sendCostCheck() {
	this.webSocket.send(
		JSON.stringify({
			type: "COST_CHECK",
			playerId: this.playerId,
			STRENGTH: document.getElementById("strengthTotal").textContent,
			DEXTERITY: document.getElementById("dexterityTotal").textContent,
			ARCANA: document.getElementById("arcanaTotal").textContent,
			DIVINITY: document.getElementById("divinityTotal").textContent
		})
	)
}

// TODO
// just gotta do this when they click an active ability
sendTargetCheck(abilityPosition){
	this.webSocket.send(
		JSON.stringify({
			type: "TARGET_CHECK",
			playerId: this.playerId,
			ability: abilityPosition
		})
	)
}

sendEnergyTrade(map, type){
	this.webSocket.send(
		JSON.stringify({
			type: "ENERGY_TRADE",
			playerId: this.playerId,
			spent: map,
			chosen: type
		})
	)
}

sendTurnEnd() {
	const payload = {
		type: "TURN_END",
		playerId: this.playerId
		// TODO structure a real pojo for how this flow will work (ability order matters... old abilities could be sent too.. list of ablity:target pairs?)
		// move1: $("#move1").val(),
		// move2: $("#move2").val(),
		// move3: $("#move3").val(),
		// target1: $("#target1").val(),
		// target2: $("#target2").val(),
		// target3: $("#target3").val()
	}
    this.webSocket.send(
		JSON.stringify(payload)
    );
}

// END OF SEND MESSAGES

// HANDLE MESSAGES

handleEnergyTrade(msg) {
	this.clearSpent();
	if (msg.battle.playerIdOne === msg.playerId){
		this.handleAndFormatEnergy(msg.battle.playerOneEnergy);
	} else {
		this.handleAndFormatEnergy(msg.battle.playerTwoEnergy);
	}
}


handleCostCheck(msg) {
	console.log("GOT COST CHECK MESSAGE");
	// recieve message from backend, and disable abilities that we do not have enough energy for
}

handleTargetCheck(msg) {
	console.log("GOT TARGET CHECK MESSAGE");
	let battle = msg.battle;
	// const button1 = document.getElementById("enemyButton1");  TODO
	// const button2 = document.getElementById("enemyButton2");
	// const button3 = document.getElementById("enemyButton3");
	// const button4 = document.getElementById("allyButton1");
	// const button5 = document.getElementById("allyButton2");
	// const button6 = document.getElementById("allyButton3");
	// let team1 = battle.playerOneTeam;
	// let team2 = battle.playerTwoTeam;
	
	// if (this.isPlayerOne) {
	// 	team1.forEach(x => {
	// 		if (x.highlighted) {
	// 			const button = document.getElementById("allyButton" + (x.position + 1));
	// 			// MAKE BUTTON HIGHLIGHTED
	// 		}
	// 	})
	// }
	
	// // recieve message from backend, and highlight appropriate available targets
}

handleTurnEnd(msg) {
	const finishButton = document.getElementById("finishButton");
	const tradeButton = document.getElementById("tradeButton");
	if(msg.playerId != this.playerId){
		console.log("Recieved turn end!");
    this.finishButton_disabled = false;
    this.tradeButton_disabled = false;

		//  TIMER 
		this.showAbilities();
		// logic here to show my abilities again
		// and perform cost check
		
		if (this.isPlayerOne) {
			this.handleAndFormatEnergy(msg.battle.playerOneEnergy);
		} else {
			this.handleAndFormatEnergy(msg.battle.playerTwoEnergy);
		}
	} else {
		console.log("Ended Turn");
    this.finishButton_disabled = true;
    this.tradeButton_disabled = true;

		// TIMER
		this.hideAbilities();
		// logic here to hide abilities (this logic could be used on init too)
	}
	// recieve message from backend, and then pass turn control and show applied effects/damage from last turn
}

// END OF HANDLE MESSAGES 


  // END OF SLATE





  
  // close and null out web socket
  disconnect() {
    this.webSocket.close();
    this.webSocket = null;
    console.log("Disconnected");
  }
}
