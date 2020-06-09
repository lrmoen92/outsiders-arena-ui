import { Component, Input, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Battle, Character, Player, CharacterInstance, BattleTurnDTO, AbilityTargetDTO, Ability, Effect} from 'src/app/model/api-models';
import { URLS } from 'src/app/utils/constants';
import { CountdownComponent, CountdownConfig, CountdownEvent } from 'ngx-countdown';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import { timer } from 'rxjs';
import { FormControl } from '@angular/forms';

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

	@ViewChild(CountdownComponent) private countdown: CountdownComponent;
	config: CountdownConfig;

	@Input()
	allCharacters : Array<Character>;

	@Input()
	player : Player;

	//ngmodel from input
	opponentName : string;
	opponent : Player;

	arenaId : Number;
	battle : Battle;

	inBattle : Boolean = false;
	connected : Boolean = false;
	hasTurn : Boolean = false;
	isPlayerOne : Boolean = false;

	allies : Array<Character> = [];
	enemies : Array<Character> = [];

	allyPortraits : Map<Number, String> = new Map;
	enemyPortraits : Map<Number, String> = new Map;

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

	randomCap = 0;
	lockedStr = 0;
	lockedDex = 0;
	lockedArc = 0;
	lockedDiv = 0;

	energyTrade : string;
	randomsAreNeeded : boolean = false;

	totalEnergy : number = 0;
	totalSpentEnergy : number = 0;
	randomsNeeded : number = 0;


	// NGMODELS VVV
	// In battle variables VVV

	hoveredAbility : Ability = null;


	chosenAbilities : Array<AbilityTargetDTO> = [];

	// V identified by effectID, or [ABILITY1, 2, 3]
	turnEffects : Array<Effect> = [];
	isReelEmpty : boolean = true;


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

	countdownConfigFactory(): CountdownConfig {
		return {
			prettyText: (s => {return "TIMER: " + s + " SECONDS LEFT"}),
			format: `s`,
			leftTime: 40
		};
	}

	handleTimerEvent(event: CountdownEvent) {
		console.log(event);
		if(event.action === "start" || event.action == "restart") {
			this.onStart();
		} else if (event.action === "done") {
			this.onStop();
		}
	}

	onStart() {
		// play starting sound effect
	}

	onStop() {
		// play warning sound effect
		// add 2 second grace period here

		// force turn end and clean up
		if (this.hasTurn) {
			if (this.randomsNeeded > 0) {
				// put all shit back and empty abilities array
			}

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

	spendEnergy(energy : string, force : boolean) {

		if(energy === "RANDOM") {
			// same here I think, not trying to spend a random into the map above :O
		} else {

			if(this.abilitiesAreChosen() && this.randomsNeeded === 0 && !force) {
				alert("You don't need to spend more!");
			} else if (this.randomsAreNeeded && !force) {
				this.randomsNeeded--;
				if (this.randomsNeeded === 0) {
					this.randomsAreNeeded = false;
				}
				this.spendCopy(energy);
			} else {
				this.spendCopy(energy);
			} 
		}
	}

	spendCopy(energy: string) {
		let temp : Map<string, Number> = this.copyMap(this.turnEnergy);

		let oldVal = temp[energy]
		temp[energy] = oldVal - 1;
		
		let temp2 : Map<string, Number> = this.copyMap(this.spentEnergy);

		let oldVal2 = temp2[energy]
		temp2[energy] = oldVal2 + 1;

		this.setTurnEnergy(temp);
		this.setSpentEnergy(temp2);
	}

	returnEnergy(energy : string, force : boolean) {
		
		if(energy === "RANDOM") {
			// only for refunding abilities I guess
			// this.removeNonLockedEnergy();
		} else {

			if (!force) {
				this.calculateLockedEnergy();
			}

			if (energy === "STRENGTH" && this.spentStrength.length === this.lockedStr && !force) {
				alert("You can't remove that energy, remove the ability you spent it on first!");
			} else if (energy === "DEXTERITY" && this.spentDexterity.length === this.lockedDex && !force) {
				alert("You can't remove that energy, remove the ability you spent it on first!");
			} else if (energy === "ARCANA" && this.spentArcana.length === this.lockedArc && !force) {
				alert("You can't remove that energy, remove the ability you spent it on first!");
			} else if (energy === "DIVINITY" && this.spentDivinity.length === this.lockedDiv && !force) {
				alert("You can't remove that energy, remove the ability you spent it on first!");
			} else {
				if (!force) {
					console.log(this.randomCap);
					if (this.randomsNeeded < this.randomCap) {
						this.randomsNeeded++;
					} else if (this.randomsNeeded === 0 || this.randomCap === 0) {
						// this is normal, do nothing
					} else {
						// we dont need anymore randoms, just give it back as normal?
					}
				}
	
	
				let temp : Map<string, Number> = this.copyMap(this.turnEnergy);
	
				let oldVal = temp[energy]
				temp[energy] = oldVal + 1;
				
				let temp2 : Map<string, Number> = this.copyMap(this.spentEnergy);
	
				let oldVal2 = temp2[energy]
				temp2[energy] = oldVal2 - 1;
	
				this.setTurnEnergy(temp);
				this.setSpentEnergy(temp2);
			}
		}
	}

	abilitiesAreChosen() {
		return this.chosenAbilities.length > 0;
	}
	
	calculateLockedEnergy() {
		this.randomCap = 0;
		this.lockedStr = 0;
		this.lockedDex = 0;
		this.lockedArc = 0;
		this.lockedDiv = 0;
		if(this.abilitiesAreChosen()) {
			for (let dto of this.chosenAbilities) {
				for (let str of dto.ability.cost) {
					if (str === "RANDOM") {
						this.randomCap++;
					} else if (str === "STRENGTH") {
						this.lockedStr++;
					} else if (str === "DEXTERITY") {
						this.lockedDex++
					} else if (str === "ARCANA") {
						this.lockedArc++
					} else if (str === "DIVINITY") {
						this.lockedDiv++
					}
				}
			}
		}
	}

	removeNonLockedEnergy() {

		if (this.spentEnergy["STRENGTH"] > this.lockedStr) {
			this.returnEnergy("STRENGTH", true);
		} else if (this.spentEnergy["DEXTERITY"] > this.lockedDex) {
			this.returnEnergy("DEXTERITY", true);
		} else if (this.spentEnergy["ARCANA"] > this.lockedArc) {
			this.returnEnergy("ARCANA", true);
		} else  if (this.spentEnergy["DIVINITY"] > this.lockedDiv) {
			this.returnEnergy("DIVINITY", true);
		} else {
			alert("this should never happen");
		}
	}

	
	payCostTemporary(ability) {
		let costs = ability.cost;
		for (let s of costs) {
			console.log("energy spent: " + s);
			if (s !== "RANDOM") {
				this.spendEnergy(s, true);
			} else {
				this.randomsNeeded++;
				this.randomsAreNeeded = true;
				// this.totalEnergy--;
			}
		}
	}

	refundCostTemporary(ability) {
		let costs = ability.cost;
		this.calculateLockedEnergy();
		let randomsToRefund = this.randomCap - this.randomsNeeded;
		for (let s of costs) {
			console.log("energy refunded: " + s)
			if (s !== "RANDOM") {
				this.returnEnergy(s, true);
				
				if (s === "STRENGTH") {
					this.lockedStr--;
				} else if (s === "DEXTERITY") {
					this.lockedDex--;
				} else if (s === "ARCANA") {
					this.lockedArc--;
				} else  if (s === "DIVINITY") {
					this.lockedDiv--;
				} else {
					alert("this should never happen2");
				}

			} else {
				if (randomsToRefund > 0) {
					// correct spent by checking for the closest non-locked energy
					this.removeNonLockedEnergy();
					randomsToRefund--;
				}
				if(this.randomsAreNeeded){
					this.randomsNeeded--;
				}

				if (this.randomsNeeded === 0) {
					this.randomsAreNeeded = false;
				}
			}
		}
	}

	clickEnergyTrade() {
		if (!this.energyTrade) {
			alert("Pick an energy to trade for.");
		} else if (this.totalSpentEnergy !== 5) {
			alert("You must spend 5 energy, to trade for 1");
		} else {
			this.sendEnergyTrade(this.spentEnergy, this.energyTrade);
		}
	}

	refreshTradeState() {
		this.randomsNeeded = 0;
		this.randomsAreNeeded = false;
		this.energyTrade = null;
	}


	// ======================================================================================================================
	// ------ ABILITIES/TARGETS ---------------------------------------------------------------------------------------------
	// ======================================================================================================================

	clickAbility(ability) {
		if (this.abilityCurrentlyClicked) {
			// can't click abilities twice
		} if(this.totalSpentEnergy > 0 && !this.abilitiesAreChosen()) {
			alert("Finish your energy trade or put your spent energy back before choosing abilities!")
		} else {
			// set ability as variable
			this.chosenAbility = ability;

			// TODO: 
			// show this somewhere on ui (we kinda do now, it locks)
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

			// add DTO for backend call, gets sent at the end!!! (got it)
			this.chosenAbilities.push(dto);

			// add ability to UI
			this.addAbilityToReel(this.chosenAbility);
			this.clearSelection();

			// update Energy and call cost check again
			// be sure to add randoms needed to spent total to get true energy total for cost check
			// this.sendCostCheck();
			// update random count needed to finish turn
		} else {
			// TODO:
			// clicking targets should show character blurb normally (duh)
		}
	}

	clickCancel() {
		if (this.abilityCurrentlyClicked) {
			this.clearSelection();
		} else {
			if (this.chosenAbilities.length > 0) {

			}
		}
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
		this.payCostTemporary(ability);
		let tempEffect = new Effect();
		tempEffect.instanceId = -1;
		tempEffect.avatarUrl = ability.abilityUrl;
		tempEffect.name = ability.name;
		this.turnEffects.push(tempEffect);
		if(this.isReelEmpty) {
			this.isReelEmpty = false;
		}
	}

	removeAbilityFromReel(effect : Effect) {
		// gotta reverse engineer the ability
		if (effect.instanceId > 0) {
			// can't remove pre-existing conditions breh
		} else {
			var index = this.chosenAbilities.findIndex(a => a.ability.name==effect.name);
			let ability = this.chosenAbilities[index].ability;
			var index2 = this.turnEffects.findIndex(e => (e.instanceId < 0 && e.name === effect.name));

			this.refundCostTemporary(ability);

			this.chosenAbilities.splice(index, 1);
			this.turnEffects.splice(index2, 1);
		}
		if (this.turnEffects.length === 0) {
			this.isReelEmpty = true;
		}
	}

	drop(event: CdkDragDrop<string[]>) {
		moveItemInArray(this.turnEffects, event.previousIndex, event.currentIndex);
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
				energyTotal: this.randomsNeeded + this.totalSpentEnergy,
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

	sendEnergyTrade(energySpent : Map<String, Number>, energyGained : string){
		this.webSocket.send(
			JSON.stringify({
				type: "ENERGY_TRADE",
				playerId: this.player.id,
				spent: energySpent,
				chosen: energyGained
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
		let effects : Array<Effect> = this.turnEffects;

		// BUILD DTO HERE

		let battleTurnDTO : BattleTurnDTO = {
			spentEnergy : spentEnergy,
			abilities : abilityDTOs,
			effects : effects
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
		this.availableTargets = [];
		this.randomsNeeded = 0;
		this.randomsAreNeeded = false;
		this.isReelEmpty = true;
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

		for (let c of this.allies) {
			this.allyPortraits.set(c.id, c.avatarUrl);
		}
		for (let c of this.enemies) {
			this.enemyPortraits.set(c.id, c.avatarUrl);
		}
	}

	handleEnergyTradeResponse(msg) {
		// TODO
		console.log("GOT ENERGY TRADE RESPONSE");
		let battle = msg.battle;
		if (this.isPlayerOne) {
			this.setTurnEnergy(battle.playerOneEnergy);
		} else {
			this.setTurnEnergy(battle.playerTwoEnergy);
		}
		this.setSpentEnergy(this.newMap());
		this.energyTrade = null;
		// do another cost check 
		// this.sendCostCheck();
	}
  
	handleCostCheckResponse(msg) {
		console.log("GOT COST CHECK RESPONSE");
		console.log(msg);

		// array of numbers to enable, and -1's to ignore
		// number of randoms needed after this move
		// optional response 
		// recieve message from backend, and disable abilities that we do not have enough energy for
	}

	handleTargetCheckResponse(msg) {
		console.log("GOT TARGET CHECK RESPONSE");
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
			this.refreshTradeState();
		} else {
			this.setTurnEnergy(this.battle.playerTwoEnergy);
			this.setSpentEnergy(this.newMap());
			this.refreshTradeState();
		}

		// TODO:
		// handle populating the turnEffectsMap (and appropriate boolean, isReelEmpty)

		// Cost check
		// this.sendCostCheck();

		// check and perform damage (might happen automatically with battle? idk)

		// apply effects visually (not sure how much this is, maybe effect bubbles)

		// kill characters (this is the only one I'm sure I have to do, ALSO SOUND EFFECT)
		this.countdown.restart();
	}

}
