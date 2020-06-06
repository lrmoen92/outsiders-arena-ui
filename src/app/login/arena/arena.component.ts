import { Component, Input, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Battle, Character, Player, CharacterInstance, BattleTurnDTO, AbilityTargetDTO, Ability, Effect} from 'src/app/model/api-models';
import { URLS } from 'src/app/utils/constants';
import { CountdownComponent, Config } from 'ngx-countdown';
@Component({
  selector: 'arena-root',
  templateUrl: './arena.component.html',
  styleUrls: ['./arena.component.css']
})
export class ArenaComponent {

	// ======================================================================================================================
	// ------ PROPERTIES ----------------------------------------------------------------------------------------------------
	// ======================================================================================================================

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
	totalEnergy : number = 0;
	turnStrength : Array<string>;
	turnDexterity : Array<string>;
	turnArcana : Array<string>;
	turnDivinity : Array<string>;

	// NGMODELS VVV
	spentEnergy : Map<string, Number> = new Map();
	totalSpentEnergy : number = 0;
	spentStrength : Array<string>;
	spentDexterity : Array<string>;
	spentArcana : Array<string>;
	spentDivinity : Array<string>;

	randomsNeeded : number = 0;


	// NGMODELS VVV
	// In battle variables VVVV

	@ViewChild(CountdownComponent) private countdown: CountdownComponent;
	private config: Config;

	hoveredAbility : Ability = null;
	chosenAbilities : Array<AbilityTargetDTO> = [];
	turnEffects : Array<Effect> = [];


	// V identified by effectID, or [ABILITY1, 2, 3]
	turnEffectOrder : Array<string> = [];


	chosenAbility: Ability;
	availableTargets: Array<Number> = [];
	abilityCurrentlyClicked: boolean;

	// ======================================================================================================================
	// ------ LIFECYCLE -----------------------------------------------------------------------------------------------------
	// ======================================================================================================================

	constructor(httpClient : HttpClient) {
		this.httpClient = httpClient;
	}

	ngOnInit() {
		if (this.webSocket != null) {
			this.disconnect();
		}
		this.config = this.countdownConfigFactory();
	}

	// ngOnDestroy() {
	// 	if (this.webSocket != null) {
	// 		this.disconnect();
	// 	}
	// }

	// close and null out web socket
	disconnect() {
		this.webSocket.close();
		this.webSocket = null;
		console.log("Disconnected");
	}

	// ======================================================================================================================
	// ------ CHARACTER SELECT ----------------------------------------------------------------------------------------------
	// ======================================================================================================================

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

	// ======================================================================================================================
	// ------ TIMER --------------------------------------------------------------------------------------------------------
	// ======================================================================================================================

	countdownConfigFactory(): Config {
		return { 
			template: `Timer: $!s! Seconds`,
			leftTime: 40
		};
	}

	onStart() {
		// play starting sound effect
	}

	onFinished() {
		// play warning sound effect
		// add 2 second grace period here

		// force turn end and clean up
		if (this.hasTurn) {
			this.sendTurnEndMessage();
		}
		// play ending sound effect
	}

	// ======================================================================================================================
	// ------ ENERGY --------------------------------------------------------------------------------------------------------
	// ======================================================================================================================

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

	setTurnEnergy(energyMap) {
		this.turnEnergy = energyMap;
		this.turnStrength = [];
		this.turnDexterity = [];
		this.turnArcana = [];
		this.turnDivinity = [];
		this.totalEnergy = 0;
		for(let x=0; x < this.turnEnergy["STRENGTH"]; x++) {
			this.totalEnergy++;
			this.turnStrength.push("STRENGTH");
		}
		for(let x=0; x < this.turnEnergy["DEXTERITY"]; x++) {
			this.totalEnergy++;
			this.turnDexterity.push("DEXTERITY");
		}
		for(let x=0; x < this.turnEnergy["ARCANA"]; x++) {
			this.totalEnergy++;
			this.turnArcana.push("ARCANA");
		}
		for(let x=0; x < this.turnEnergy["DIVINITY"]; x++) {
			this.totalEnergy++;
			this.turnDivinity.push("DIVINITY");
		}
	}

	setSpentEnergy(energyMap) {
		this.spentEnergy = energyMap;
		this.spentStrength = [];
		this.spentDexterity = [];
		this.spentArcana = [];
		this.spentDivinity = [];
		this.totalSpentEnergy = 0;
		for(let x=0; x < this.spentEnergy["STRENGTH"]; x++) {
			this.totalSpentEnergy++
			this.spentStrength.push("STRENGTH");
		}
		for(let x=0; x < this.spentEnergy["DEXTERITY"]; x++) {
			this.totalSpentEnergy++
			this.spentDexterity.push("DEXTERITY");
		}
		for(let x=0; x < this.spentEnergy["ARCANA"]; x++) {
			this.totalSpentEnergy++
			this.spentArcana.push("ARCANA");
		}
		for(let x=0; x < this.spentEnergy["DIVINITY"]; x++) {
			this.totalSpentEnergy++
			this.spentDivinity.push("DIVINITY");
		}
	}

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

	// ======================================================================================================================
	// ------ ABILITIES/TARGETS ---------------------------------------------------------------------------------------------
	// ======================================================================================================================

	clickAbility(ability) {
		if (this.abilityCurrentlyClicked) {
			// can't click abilities twice
		} else {
			// set ability as variable
			this.chosenAbility = ability;

			// TODO: 
			// show this somewhere on ui

			// set variable for hiding
			this.abilityCurrentlyClicked = true;

			// TODO: 
			// call for and show available targets

			// currently just setting to all :///
			this.availableTargets = [0, 1, 2, 3, 4, 5];
		}
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
			this.addAbilityToReel(this.chosenAbility);
			this.clearSelection();

			// update Energy and call cost check again
			this.sendCostCheck();
			// update random count needed to finish turn
		}
	}

	clickCancel() {
		this.clearSelection();
	}

	clearSelection() {
		this.abilityCurrentlyClicked = false;
		this.hideAbilityPanel();
	}

	hideAbilityPanel() {
		// check if ability was clicked but no target chosen
		if (this.abilityCurrentlyClicked) {
			// dont hide 
		} else {
			this.hoveredAbility = null;
			this.chosenAbility = null;
		}
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
		if (this.abilityCurrentlyClicked) {
			// dont mess with info already there
		} else {
			this.hoveredAbility = ability;
			console.log(this.hoveredAbility);
		}
	}

	// ======================================================================================================================
	// ------ SEND MESSAGES -------------------------------------------------------------------------------------------------
	// ======================================================================================================================

	// TODO
	// gotta do this any time they assign one target/ability too!
	// send ability id 
	sendCostCheck() {
		this.webSocket.send(
			JSON.stringify({
				type: "COST_CHECK",
				playerId: this.player.id,
				ability: this.chosenAbility
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
		if (this.randomsNeeded > 0) {
			alert("More Energy Needed!");
		} else {
			this.sendTurnEndMessage();
		}
	}
		
	sendTurnEndMessage() {

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



		this.cleanUpPhase();
		// CLEAN UP everything
	}

	cleanUpPhase() {
		this.abilityCurrentlyClicked = false;
		this.chosenAbility = null;
		this.hoveredAbility = null;
		this.chosenAbilities = [];
		this.turnEffects = [];
		this.turnEffectOrder = [];
		this.availableTargets = [];
		this.randomsNeeded = 0;
	}


	// ======================================================================================================================
	// ------ HANDLE MESSAGES -----------------------------------------------------------------------------------------------
	// ======================================================================================================================

	// this method gets called once WS is created to initiate the message routing logic
	handleMessage() {
		this.webSocket.onmessage = response => {
			let msg = JSON.parse(response.data);
			let mtp = msg.type;
			console.log(msg);
			if (mtp === "INIT") {
				this.handleInitResponse(msg);
				this.inBattle = true;
			} else if (mtp === "CCHECK") {
				this.handleCostCheckResponse(msg);
			} else if (mtp === "TCHECK") {
				this.handleTargetCheckResponse(msg);
			} else if (mtp === "ETRADE") {
				this.handleEnergyTradeResponse(msg);
			} else if (mtp === "END") {
				this.handleTurnEndResponse(msg);
			} else {
				if (msg !== "WAITING FOR OPPONENTS"){
					console.log("UNRECOGNIZED");
				}
			}
		}
	}
  
	handleInitResponse(msg) {
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

	handleEnergyTradeResponse(msg) {
		// TODO
		console.log(msg);
	}
  
	handleCostCheckResponse(msg) {
		console.log("GOT COST CHECK MESSAGE");
		console.log(msg);
		// handle all updating of assigning energy update, auto move spent energy,
		// and calculate spent and needed randoms


		// array of numbers to enable, and -1's to ignore
		// number of randoms needed after this move
		// optional response 
		// recieve message from backend, and disable abilities that we do not have enough energy for
	}

	handleTargetCheckResponse(msg) {
		console.log("GOT TARGET CHECK MESSAGE");
		let battle = msg.battle;
		//TODO
		// recieve message from backend, and highlight appropriate available targets
	}
  
	// this is where we "START our turn", but we have to resolve a lot of stuff from backend first
	handleTurnEndResponse(msg) {
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

		// Cost check
		this.sendCostCheck();

		// check and perform damage (might happen automatically with battle? idk)

		// apply effects visually (not sure how much this is, maybe effect bubbles)

		// kill characters (this is the only one I'm sure I have to do, ALSO SOUND EFFECT)
		this.countdown.restart();
	}

}
