import { Component, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Battle, Character, Player, CharacterInstance, BattleTurnDTO, AbilityTargetDTO, Ability, Effect} from 'src/app/model/api-models';
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
	hasTurn : Boolean = false;

	allies : Array<Character> = [];
	enemies : Array<Character> = [];

	battleAllies : Array<CharacterInstance> = [];
	battleEnemies : Array<CharacterInstance> = [];

	// NGMODELS VVV
	turnEnergy : Map<string, Number> = new Map();
	turnStrength : Array<string>;
	turnDexterity : Array<string>;
	turnArcana : Array<string>;
	turnDivinity : Array<string>;

	// NGMODELS VVV
	spentEnergy : Map<string, Number> = new Map();
	spentStrength : Array<string>;
	spentDexterity : Array<string>;
	spentArcana : Array<string>;
	spentDivinity : Array<string>;

	// NGMODELS VVV

	// In battle variables VVVV

	hoveredAbility : Ability = null;
	chosenAbilities : Array<AbilityTargetDTO> = [];
	turnEffects : Array<Effect> = [];
	// V identified by effectID, or [ABILITY1, 2, 3]
	turnEffectOrder : Array<string> = [];

	chosenAbility: Ability;
	availableTargets: Array<Number> = [];

	constructor(httpClient : HttpClient) {
		this.httpClient = httpClient;
	}

	setTurnEnergy(energyMap) {
		this.turnEnergy = energyMap;
		this.turnStrength = [];
		this.turnDexterity = [];
		this.turnArcana = [];
		this.turnDivinity = [];
		for(let x=0; x < this.turnEnergy["STRENGTH"]; x++) {
			this.turnStrength.push("STRENGTH");
		}
		for(let x=0; x < this.turnEnergy["DEXTERITY"]; x++) {
			this.turnDexterity.push("DEXTERITY");
		}
		for(let x=0; x < this.turnEnergy["ARCANA"]; x++) {
			this.turnArcana.push("ARCANA");
		}
		for(let x=0; x < this.turnEnergy["DIVINITY"]; x++) {
			this.turnDivinity.push("DIVINITY");
		}
	}

	setSpentEnergy(energyMap) {
		this.spentEnergy = energyMap;
		this.spentStrength = [];
		this.spentDexterity = [];
		this.spentArcana = [];
		this.spentDivinity = [];
		for(let x=0; x < this.spentEnergy["STRENGTH"]; x++) {
			this.spentStrength.push("STRENGTH");
		}
		for(let x=0; x < this.spentEnergy["DEXTERITY"]; x++) {
			this.spentDexterity.push("DEXTERITY");
		}
		for(let x=0; x < this.spentEnergy["ARCANA"]; x++) {
			this.spentArcana.push("ARCANA");
		}
		for(let x=0; x < this.spentEnergy["DIVINITY"]; x++) {
			this.spentDivinity.push("DIVINITY");
		}
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
			alert ("Take it easy, you've already got 3 characters.");
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
	  this.allies.forEach(a => {
		console.log("Chars: " + a.name);
	  })
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
		this.setTurnEnergy(this.battle.playerOneEnergy);
		this.setSpentEnergy(this.newMap());
		
		if (this.battle.playerOneStart) {
			this.hasTurn = true;
		}
		
	  } else {
		this.player = msg.playerTwo;
		this.opponent = msg.playerOne;

		this.enemies.push(msg.characters[0]);
		this.enemies.push(msg.characters[1]);
		this.enemies.push(msg.characters[2]);

		this.battleAllies = this.battle.playerTwoTeam;
		this.battleEnemies = this.battle.playerOneTeam;
		this.setTurnEnergy(this.battle.playerTwoEnergy);
		this.setSpentEnergy(this.newMap());

		if (!this.battle.playerOneStart) {
			this.hasTurn = true;
		}
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
	// BUILD DTO

	let spentEnergy : Map<string, Number> = this.spentEnergy;
	let abilityDTOs : Array<AbilityTargetDTO> = this.chosenAbilities;
	let effectIds : Array<string> = this.turnEffectOrder;

	// BUILD DTO HERE

	let battleTurnDTO : BattleTurnDTO = {
		spentEnergy : spentEnergy,
		abilities : abilityDTOs,
		effectIds : effectIds
	}
	console.log(battleTurnDTO);
	  const payload = {
		  type: "TURN_END",
		  playerId: this.player.id,
		  battleTurnDTO: battleTurnDTO
	  }
	  this.webSocket.send(
		  JSON.stringify(payload)
	  );
  }

  clickAbility(ability) {
	  // set ability as variable
	this.chosenAbility = ability;

	// TODO: 
	// show this somewhere on ui

	// TODO: 
	  // call for and show available targets

	  // currently just setting to all :///
	this.availableTargets = [0, 1, 2, 3, 4, 5];


  }

  clickTarget(targetLocation) {
	if (this.chosenAbility) {
	// form and add AbiltyTargetDTOS to array
	let dto = new AbilityTargetDTO;
	dto.ability = this.chosenAbility;
	
	// check chosen ability if it's AOE, or take target enemy
	if (this.chosenAbility.aoe) {
		if (targetLocation > 2) {
			targetLocation = [3, 4, 5]
		} else {
			targetLocation = [0, 1, 2]
		}
	} else {
		targetLocation = [targetLocation];
	}
	dto.targets = targetLocation;

	// add DTO for backend call
	this.chosenAbilities.push(dto);

	// add ability to UI
	this.addAbilityToReel(this.chosenAbility)
	this.chosenAbility = null;
	}
  }

  hideAbilityPanel() {
	  this.hoveredAbility = null;
  }

  // even though they're shown on the same reel,
  // ordering effects and dummyEffects act independently
  // as finding an effectID with "ABILITY" will look to 
  // secondary array (holding turn ability order separately)
  
  addAbilityToReel(ability) {
	this.turnEffectOrder.push(ability.name);
	let tempEffect = new Effect();
	tempEffect.instanceId = "ABILITY";
	tempEffect.avatarUrl = ability.abilityUrl;
	tempEffect.name = ability.name;
	this.turnEffects.push(tempEffect);
  }

  showAbilityInfo(ability) {
	this.hoveredAbility = ability;
	console.log(this.hoveredAbility);
  }

  newMap() {
	let temp : Map<string, Number> = new Map();
	temp["STRENGTH"]=0;
	temp["DEXTERITY"]=0;
	temp["ARCANA"]=0;
	temp["DIVINITY"]=0;
	return temp;
  }

  copyMap(a : Map<string, Number>) {
	let temp : Map<string, Number> = new Map();
	
	temp["STRENGTH"]=a["STRENGTH"];
	temp["DEXTERITY"]=a["DEXTERITY"];
	temp["ARCANA"]=a["ARCANA"];
	temp["DIVINITY"]=a["DIVINITY"];
	return temp;
  }
  
  // END OF SEND MESSAGES

  spendEnergy(energy : string) {

	let temp : Map<string, Number> = this.copyMap(this.turnEnergy);

	let oldVal = temp[energy]
	temp[energy] = oldVal - 1;
	
	let temp2 : Map<string, Number> = this.copyMap(this.spentEnergy);

	let oldVal2 = temp2[energy]
	temp2[energy] = oldVal2 + 1;

	this.setTurnEnergy(temp);
	this.setSpentEnergy(temp2);
  }

  returnEnergy(energy : string) {

	let temp : Map<string, Number> = this.copyMap(this.turnEnergy);

	let oldVal = temp[energy]
	temp[energy] = oldVal + 1;
	
	let temp2 : Map<string, Number> = this.copyMap(this.spentEnergy);

	let oldVal2 = temp2[energy]
	temp2[energy] = oldVal2 - 1;

	this.setTurnEnergy(temp);
	this.setSpentEnergy(temp2);
  }
  
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
	if (msg.playerId === this.player.id) {
		console.log("You ended your turn");
	} else {
		console.log("They ended their turn");
	}

	this.hasTurn = !this.hasTurn;
	this.battle = msg.battle;

	if (this.battle.playerIdOne === this.player.id) {
		this.setTurnEnergy(this.battle.playerOneEnergy);
		this.setSpentEnergy(this.newMap());
	} else {
		this.setTurnEnergy(this.battle.playerTwoEnergy);
		this.setSpentEnergy(this.newMap());
	}

	// check and peform damage

	// apply effects visually

	// kill characters
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
