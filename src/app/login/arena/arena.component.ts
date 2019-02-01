import { Component, OnInit, Input, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Battle, Character, Player, CharacterInstance} from 'src/app/model/api-models';
import { URLS } from 'src/app/utils/constants';
@Component({
  selector: 'arena-root',
  templateUrl: './arena.component.html',
  styleUrls: ['./arena.component.css']
})
export class ArenaComponent {

	httpClient : HttpClient;
	webSocket : WebSocket = null;

	@Input()
	allCharacters : Array<Character>;

	@Input()
	player : Player;
	isPlayerOne : Boolean;

	//ngmodel from input
	opponentName : string;
	opponent : Player;

	arenaId : Number;
	battle : Battle;

	inBattle : Boolean = false;
	connected : Boolean = false;

	allies : Array<Character> = [];
	enemies : Array<Character> = [];

	battleAllies : Array<CharacterInstance> = [];
	battleEnemies : Array<CharacterInstance> = [];

	constructor(httpClient : HttpClient) {
		this.httpClient = httpClient;
	}

	ngOnInit() {
		if (this.webSocket != null) {
			this.disconnect();
		}
	}

	removeCharacter(id) {
		this.allies.splice(this.allies.findIndex(e => {return e.id === id}), 1);
	}

	addCharacter(id) {
		let char : Character = this.allCharacters.find(e => {return e.id === id});
		if(this.allies.includes(char)) {
			alert ("You already have that character");
		} else if (this.allies.length < 3) {
			this.allies.push(char);
		} else {
			alert ("Take it easy, you got 3 characters.");
		}
	}

	  
// find battle -- OPEN SOCKET
findBattle() {
	if (this.opponentName) {
		if (this.allies.length !== 3) {
			alert ("You must select three characters");
		} else {
			this.connectByPlayerName(this.opponentName);
		}
	} else {
		alert("You must enter an opponent's display name.")
	}
}

	  // find the player you'd like to play with, and get their arenaID, or find no player and get your own (and enter matchmaking)
connectByPlayerName(name : string) {
	console.log('::Connecting to ' + name);
	this.httpClient.get(URLS.playerArena + this.player.id + '/' + name).subscribe(
	  x => {
		this.arenaId = <Number> x;
	  },
	  y => {
  
	  },
	  () => {
		this.connectByArenaId();
	  }
	);
  }
  
  // simply connect to one "arena", aka one websocket using ArenaID
  connectByArenaId() {
	  this.webSocket = new WebSocket(URLS.battleSocket + this.arenaId);
	  this.webSocket.onopen = () => {
		this.handleMessage();
		this.sendMatchMakingMessage();
	  }
  }
  
  // (this is a send message but it made more sense to put it above)
  sendMatchMakingMessage() {
	  console.log("PlayerID: " + this.player.id);
	  console.log("Chars: " + this.allies);
	  console.log("ArenaID: " + this.arenaId);
	  let msg = {
		  type: "MATCH_MAKING",
		  char1: this.allies[0].id,
		  char2: this.allies[1].id,
		  char3: this.allies[2].id,
		  playerId: this.player.id,
		  arenaId: this.arenaId,
		  opponentName: this.opponentName 
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
			this.inBattle = true;
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
	  this.isPlayerOne = msg.battle.playerIdOne === this.player.id;
	  this.battle = msg.battle;

	  if (this.isPlayerOne){
		this.player = msg.playerOne;
		this.opponent = msg.playerTwo;

		this.enemies.push(msg.characters[3]);
		this.enemies.push(msg.characters[4]);
		this.enemies.push(msg.characters[5]);

		this.battleAllies = this.battle.playerOneTeam;
		this.battleEnemies = this.battle.playerTwoTeam;
		
	  } else {
		this.player = msg.playerTwo;
		this.opponent = msg.playerOne;

		this.enemies.push(msg.characters[0]);
		this.enemies.push(msg.characters[1]);
		this.enemies.push(msg.characters[2]);

		this.battleAllies = this.battle.playerTwoTeam;
		this.battleEnemies = this.battle.playerOneTeam;
	  }
  }
  
  
  // ------ SEND MESSAGES
  
  // TODO
  // gotta do this any time they assign one target/ability too!
  sendCostCheck() {
	  this.webSocket.send(
		  JSON.stringify({
			  type: "COST_CHECK",
			  playerId: this.player.id,
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
			  playerId: this.player.id,
			  ability: abilityPosition
		  })
	  )
  }
  
  sendEnergyTrade(map, type){
	  this.webSocket.send(
		  JSON.stringify({
			  type: "ENERGY_TRADE",
			  playerId: this.player.id,
			  spent: map,
			  chosen: type
		  })
	  )
  }
  
  sendTurnEnd() {
	  const payload = {
		  type: "TURN_END",
		  playerId: this.player.id
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
	// TODO
	console.log(msg);
  }
  
  
  handleCostCheck(msg) {
	  console.log("GOT COST CHECK MESSAGE");
	  console.log(msg);
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
// 	  const finishButton = document.getElementById("finishButton");
// 	  const tradeButton = document.getElementById("tradeButton");
// 	  if(msg.playerId != this.player.id){
// 		  console.log("Recieved turn end!");
// 	  this.finishButton_disabled = false;
// 	  this.tradeButton_disabled = false;
  
// 		  //  TIMER 
// 		  this.showAbilities();
// 		  // logic here to show my abilities again
// 		  // and perform cost check
		  
// 		  if (this.isPlayerOne) {
// 			  this.handleAndFormatEnergy(msg.battle.playerOneEnergy);
// 		  } else {
// 			  this.handleAndFormatEnergy(msg.battle.playerTwoEnergy);
// 		  }
// 	  } else {
// 		  console.log("Ended Turn");
// 	  this.finishButton_disabled = true;
// 	  this.tradeButton_disabled = true;
  
// 		  // TIMER
// 		  this.hideAbilities();
// 		  // logic here to hide abilities (this logic could be used on init too)
// 	  }
// 	  // recieve message from backend, and then pass turn control and show applied effects/damage from last turn
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
