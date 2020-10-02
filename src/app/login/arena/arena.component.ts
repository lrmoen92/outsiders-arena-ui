import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Battle, Character, Player, CharacterInstance, BattleTurnDTO, AbilityTargetDTO, Ability, Effect, BattleEffect} from 'src/app/model/api-models';
import { URLS, serverPrefix } from 'src/app/utils/constants';
import { CountdownComponent, CountdownConfig, CountdownEvent } from 'ngx-countdown';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import { faVolumeUp } from '@fortawesome/free-solid-svg-icons';
import { Router } from '@angular/router';
import { CharacterService } from '../character/character.service';
import { LoginService } from '../login.service';
import { ArenaService } from './arena.service';

@Component({
  selector: 'arena-root',
  templateUrl: './arena.component.html',
  styleUrls: ['./arena.component.css']
})
export class ArenaComponent implements OnInit {

	// ======================================================================================================================
	// ------ PROPERTIES ----------------------------------------------------------------------------------------------------
	// ======================================================================================================================

	httpClient : HttpClient;
	webSocket : WebSocket = null;

	@ViewChild(CountdownComponent) private countdown: CountdownComponent;
	config: CountdownConfig;

	allCharacters : Array<Character>;
	player : Player;
	service : CharacterService;
	loginService: LoginService;
	arenaService: ArenaService;

	//ngmodel from input
	opponentName : string;
	opponent : Player;

	arenaId : Number;
	battle : Battle;

	imgPrefix : string = serverPrefix;

	inBattle : Boolean = false;
	connected : Boolean = false;
	hasTurn : Boolean = false;
	isPlayerOne : Boolean = false;

	allies : Array<Character> = [];
	tempAllies : Array<Character> = [];
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

	activeCharacterPosition : Number = -1;
	hoveredAbility : Ability = null;
	hoveredAbilityCooldown: number;

	availableAbilities : Array<number> = [];
	chosenAbilities : Array<AbilityTargetDTO> = [];

	lockedAbilities : Array<Number> = [];

	allyCostFlag1 : boolean = false;
	allyCostFlag2 : boolean = false;
	allyCostFlag3 : boolean = false;

	// V identified by effectID, or -1
	turnEffects : Array<BattleEffect> = [];
	isReelEmpty : boolean = true;

	aoeTurnEffects : Map<Number, Array<BattleEffect>> = new Map();


	chosenAbility: Ability;
	chosenAbilityPosition : number;
	availableTargets: Array<Number> = [];
	abilityCurrentlyClicked: boolean;

	playingAudio;
	secondaryAudio;
	backingAudio;

	faVolumeUp = faVolumeUp;

	volume: number = 0.5;
	showAreYouSure: boolean;

	// ======================================================================================================================
	// ------ LIFECYCLE -----------------------------------------------------------------------------------------------------
	// ======================================================================================================================

	constructor(
		httpClient : HttpClient, 
		service : CharacterService, 
		loginService : LoginService,
		arenaService : ArenaService
	) {
		this.httpClient = httpClient;
		this.service = service;
		this.loginService = loginService;
		this.arenaService = arenaService;
	}

	ngOnInit() {
		if (this.webSocket != null && !this.arenaService.isInBattle()) {
			this.disconnect();
		}
		this.config = this.countdownConfigFactory();

		this.player = this.loginService.loggedInPlayer();

		this.service.getCharacters().subscribe(
			x => {
			  this.service.setCharacters(<any[]> x);
			},
			y => {
	  
			},
			() => {
				this.allCharacters = this.service.getAllCharacters();
				console.log("IS IN BATTLE");
				console.log(this.arenaService.isInBattle());
				if (this.arenaService.isInBattle()) {
					this.battle = this.arenaService.getCurrentBattle();
					this.inBattle = this.arenaService.isInBattle();
					this.opponent = this.arenaService.getCurrentOpponent();
					this.isPlayerOne = this.arenaService.getIsPlayerOne();
					this.hasTurn = this.arenaService.getHasTurn();
		
					this.allies = this.arenaService.getAllies();
					this.battleAllies = this.arenaService.getBattleAllies();
					this.enemies = this.arenaService.getEnemies();
					this.battleEnemies = this.arenaService.getBattleAllies();
					this.tempAllies = this.arenaService.getTempAllies();
					
					this.filterAllies();
		
					this.turnEnergy = this.arenaService.getEnergy();
					this.spentEnergy = this.arenaService.getSpent();
		
					if (this.hasTurn) {
						this.checkForAoes();
						this.sendCostCheck();
					} else {
						this.disableAbilities();
					}
				}
			}
		);



	}

	ngOnDestroy() {
		if (this.webSocket != null && !this.arenaService.isInBattle()) {
			this.disconnect();
		}
	}

	// close and null out web socket
	disconnect() {
		this.webSocket.close();
		this.webSocket = null;
		console.log("Disconnected");
	}

	// ======================================================================================================================
	// ------ AUDIO ---------------------------------------------------------------------------------------------------------
	// ======================================================================================================================

	playAudio(sound : string){

		if (this.playingAudio){
			if (this.playingAudio.ended) {
				this.stopAudio();
			}
		}
		if (!this.playingAudio) {
	
			this.playingAudio = new Audio();
			this.playingAudio.src = this.imgPrefix + "/assets/sounds/" + sound + ".wav";
			this.playingAudio.volume = this.volume;
			
			this.playingAudio.load();
			this.playingAudio.play();
		} else if (!this.secondaryAudio) {
			if (this.playingAudio.src !== this.imgPrefix + "/assets/sounds/" + sound + ".wav") {
				this.secondaryAudio = new Audio();
				this.secondaryAudio.src = this.imgPrefix + "/assets/sounds/" + sound + ".wav";
				this.secondaryAudio.volume = this.volume;

				this.secondaryAudio.load();
				this.secondaryAudio.play();
			}
		} else {
			this.stopAudio();

			this.playingAudio = new Audio();
			this.playingAudio.src = this.imgPrefix + "/assets/sounds/" + sound + ".wav";
			this.playingAudio.volume = this.volume;

			this.playingAudio.load();
			this.playingAudio.play();
		}

	}

	stopAudio() {
		if (this.playingAudio) {
			this.playingAudio.pause();
			this.playingAudio = null;
		}
		if (this.secondaryAudio) {
			this.secondaryAudio.pause();
			this.secondaryAudio = null;
		}
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


	findLadderBattle() {
		if (this.allies.length !== 3) {
			alert ("You must select three characters");
		} else {
			this.connectToLadder();
		}
	}
	
	findQuickBattle() {
		if (this.allies.length !== 3) {
			alert ("You must select three characters");
		} else {
			this.connectToQuick();
		}
	}

	findPrivateBattle() {
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
	
	connectToLadder() {
		console.log('::Looking For Ladder Match');
		this.httpClient.get(URLS.playerLadderArena + this.player.id + '/' + this.player.level).subscribe(
			x => {
				console.log(x);
				this.arenaService.setArenaId(<Number> x);
			},
			y => {

			},
			() => {
				this.arenaId = this.arenaService.getArenaId();
				this.connectByArenaId();
			}
		);
	}




	connectToQuick() {
		console.log('::Looking For Quick Match');
		this.httpClient.get(URLS.playerQuickArena + this.player.id + '/' + this.player.level)
		.subscribe(
			x => {
				this.arenaService.setArenaId(<Number> x);
			},
			y => {

			},
			() => {
				console.log(this.arenaId);
				this.arenaId = this.arenaService.getArenaId();
				this.connectByArenaId();
			}
		);
	}

	// find the player you'd like to play with, and get their arenaID, or find no player and get your own (and enter matchmaking)
	connectByPlayerName(name : string) {
		console.log('::Connecting to ' + name);
		this.httpClient.get(URLS.playerArena + this.player.id + '/' + name).subscribe(
			x => {
				this.arenaService.setArenaId(<Number> x);
			},
			y => {

			},
			() => {
				this.arenaId = this.arenaService.getArenaId();
				this.connectByArenaId();
			}
		);
	}
  
	// simply connect to one "arena", aka one websocket using ArenaID
	connectByArenaId() {
		(async () => { 
			// Do something before delay
			console.log('before delay')
	
			await this.delay(1000);
	
			// Do something after
			console.log('after delay')
			this.arenaService.setWebSocket(this.arenaId);
			this.webSocket = this.arenaService.getCurrentWebSocket();
			this.webSocket.onopen = () => {
				this.handleMessage();
				this.sendMatchMakingMessage();
			}
			this.webSocket.onerror = (e) => {
				console.log(e);
			}
			this.arenaService.setWebSocketDirect(this.webSocket);
		})();
	}

	delay(ms: number) {
		return new Promise( resolve => setTimeout(resolve, ms) );
	}
	// ======================================================================================================================
	// ------ TIMER --------------------------------------------------------------------------------------------------------
	// ======================================================================================================================

	countdownConfigFactory(): CountdownConfig {
		return {
			notify: 0,
			format: `s`,
			leftTime: 60,
			prettyText: (s => {
				return "TIMER: " + s;
			}),
		};
	}

	handleTimerEvent(event: CountdownEvent) {
		// console.log(event);
		if(event.action === "start") {
			this.onStart();
		} else if (event.action === "restart" && this.hasTurn) { 
			this.onStart();
		} else if (event.action === "notify" && event.left === 8000 && this.hasTurn) {
			this.playAudio("timerlow");
		} else if (event.action === "done") {
			this.onStop();
		}
	}

	onStart() {
		this.playAudio("yourturn");
		// play starting sound effect
	}

	onStop() {
		// force turn end and clean up
		if (this.hasTurn) {
			if (this.randomsNeeded > 0) {
				if (this.totalSpentEnergy > 0) {
					if (this.isPlayerOne) {
						this.setTurnEnergy(this.battle.playerOneEnergy);
					} else {
						this.setTurnEnergy(this.battle.playerTwoEnergy);
					}
					this.setSpentEnergy(this.newMap());
					this.refreshTradeState();
				}
				this.chosenAbilities = [];
				// filter out dtos from turn effects
				this.turnEffects.forEach((value, index, array) => {
					if (value.instanceId === -1) {
						array.splice(index);
					}
				});
				this.clearSelection(true);
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
						this.randomsAreNeeded = true;
					} else if (this.randomsNeeded === 0 || this.randomCap === 0) {
						this.randomsAreNeeded = false;
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

	filterAllies() {
		let counter = 0;
		let newAllies = [];
		
		this.allyCostFlag1 = false;
		this.allyCostFlag2 = false;
		this.allyCostFlag3 = false;
		
		for (let ally of this.allies) {
			for (let battleAlly of this.battleAllies) {
				if (ally.id === battleAlly.characterId) {

					let tempAlly = JSON.parse(JSON.stringify((ally)));
					let shouldChange = (counter === 0 && !this.allyCostFlag1) ||
										(counter === 1 && !this.allyCostFlag2) ||
										(counter === 2 && !this.allyCostFlag3);
					let didChange = false;
					if (shouldChange) {
						for (let effect of battleAlly.effects) {
							if (effect.statMods["COST_CHANGE"] !== null) {
								let num = effect.statMods["COST_CHANGE"];
								if (num) {
									didChange = true;
								}
								if (num > 0) {
									for (let i = num; i > 0; i--) {
										tempAlly.slot1.cost.push("RANDOM");
										tempAlly.slot2.cost.push("RANDOM");
										tempAlly.slot3.cost.push("RANDOM");
										tempAlly.slot4.cost.push("RANDOM");
									}
								} else if (num < 0) {
									for (let i = num; i < 0; i++) {
										if (tempAlly.slot1.cost.includes("RANDOM")) {
											console.log(tempAlly.slot1.cost);
											let index = tempAlly.slot1.cost.findIndex(e => {return e === "RANDOM"});
											console.log(index);
											tempAlly.slot1.cost.splice(index, 1);
											console.log(tempAlly.slot1.cost);
										}
										if (tempAlly.slot2.cost.includes("RANDOM")) {
											tempAlly.slot2.cost.splice(tempAlly.slot2.cost.findIndex(e => {return e === "RANDOM"}), 1);
										}
										if (tempAlly.slot3.cost.includes("RANDOM")) {
											tempAlly.slot3.cost.splice(tempAlly.slot3.cost.findIndex(e => {return e === "RANDOM"}), 1);
										}
										if (tempAlly.slot4.cost.includes("RANDOM")) {
											tempAlly.slot4.cost.splice(tempAlly.slot4.cost.findIndex(e => {return e === "RANDOM"}), 1);
										}
									}
								}
							}
						}
						if (didChange) {
							if (counter === 0) {
								this.allyCostFlag1 = true;
							} else if (counter === 1) {
								this.allyCostFlag2 = true;
							} else if (counter === 2) {
								this.allyCostFlag3 = true;
							}
						}
					}


					newAllies.push(tempAlly);
					
					counter++;
				}
			}
		}

		this.tempAllies = newAllies;
		return this.tempAllies;
	}

	clickAbility(ally, pos) {
		let ability;

		if (pos == 1) {
			ability = ally.slot1;
		} else if (pos == 2) {
			ability = ally.slot2;
		} else if (pos == 3) {
			ability = ally.slot3;
		} else if (pos == 4) {
			ability = ally.slot4;
		}

		let parentPosition = this.tempAllies.findIndex(c => {
			c.id = ally.id;
		})
		let abilityPosition = this.getAbilityPosition(ally, pos);

		if (this.abilityCurrentlyClicked) {
			// can't click abilities twice
			
		} else if (this.isAbilityLocationLocked(abilityPosition)) {
			alert("Can't use that now!")
		} else if(this.totalSpentEnergy > 0 && !this.abilitiesAreChosen()) {
			alert("Finish your energy trade or put your spent energy back before choosing abilities!")
		} else {
			// set ability as variable
			this.chosenAbility = ability;
			this.chosenAbilityPosition = abilityPosition;

			// TODO: 
			// show this somewhere on ui (we kinda do now, it locks)
			// set variable for hiding
			this.abilityCurrentlyClicked = true;
			this.activeCharacterPosition = parentPosition;

			let dto = new AbilityTargetDTO;
			dto.ability = ability;
			dto.abilityPosition = abilityPosition;
			let p2pos = this.isPlayerOne ? parentPosition : parentPosition + 3;
			dto.characterPosition = p2pos;
			dto.targetPositions = [];

			// TODO: 
			// call for and show available targets
			// currently just setting to all :///
			console.log(dto);
			this.sendTargetCheck(dto);
		}
	}

	
	getAbilityLocationCooldown(abilityLocation) : number  {
		let entry = this.availableAbilities[abilityLocation];
		if (entry < 0){
			return -1 - entry;
		} else {
			return 0;
		}
	}

	isAbilityLocationLocked(abilityLocation) : boolean  {
		if (this.availableAbilities[abilityLocation] < 0){
			return true;
		} else {
			return false;
		}
	}
	
	isTargetLocationLocked(charPos) : boolean  {
		if (this.availableTargets.length > 0) {
			if (this.availableTargets[charPos] < 0){
				return true;
			} else {
				return false;
			}
		} else {
			return false;
		}

	}

	disableAbilities() {
		this.availableAbilities = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1];
	}

	getImageStyle(ally, pos) {
		let abilityLocation = this.getAbilityPosition(ally, pos);
		if (this.availableAbilities) {
			if (this.isAbilityLocationLocked(abilityLocation)) {
				if (this.getAbilityLocationCooldown(abilityLocation) > 0) {
					return {'opacity': 0.2};
				} else {
					return {'opacity': 0.2};
				}
			} else {
				return {'opacity': 1};
			}
		}
	}

	getImageStyleCharacter(characterPosition) {
		if (this.availableTargets) {
			if (this.isTargetLocationLocked(characterPosition)) {
				return {'opacity': 0.2};
			} else {
				return {'opacity': 1};
			}
		}
	}


	clickTarget(targetLocation) {
		if (this.isTargetLocationLocked(targetLocation)) {
			alert("That character can't be targeted with this ability!");
		} else if (this.chosenAbility) {
			// form and add AbiltyTargetDTOS to array
			let dto = new AbilityTargetDTO;
			dto.ability = this.chosenAbility;
			let tarArray = [];
			// check chosen ability if it's AOE, or take target enemy
			if (this.chosenAbility.aoe) {
				if (targetLocation > 2) {
					tarArray = [3, 4, 5]
					for (let x of tarArray) {
						if(this.isTargetLocationLocked(x)) {
							tarArray.splice(tarArray.indexOf(x), 1);
						}
					}
				} else {
					tarArray = [0, 1, 2];
					for (let x of tarArray) {
						if(this.isTargetLocationLocked(x)) {
							tarArray.splice(tarArray.indexOf(x), 1);
						}
					}
				}
			} else {
				tarArray.push(targetLocation);
			}
			console.log("TARGET LOCATION CLICKED: " + tarArray);
			dto.targetPositions = tarArray;
			dto.characterPosition = this.activeCharacterPosition;
			dto.abilityPosition = this.chosenAbilityPosition;

			// add DTO for backend call, gets sent at the end!!! (got it)
			this.chosenAbilities.push(dto);

			// add ability to UI
			this.addAbilityToReel(this.chosenAbility);
			this.clearSelection(false);

			// update Energy and call cost check again
			// be sure to add randoms needed to spent total to get true energy total for cost check
			this.sendCostCheck();
			// update random count needed to finish turn
		} else {
			// TODO:
			// clicking targets should show character blurb normally (duh)
		}
	}

	clickCancel() {
		if (this.abilityCurrentlyClicked) {
			this.clearSelection(false);
		} else {
			if (this.chosenAbilities.length > 0) {

			}
		}
	}

	clearSelection(force) {
		this.abilityCurrentlyClicked = false;
		this.activeCharacterPosition = -1;
		this.availableTargets = [];
		this.hideAbilityPanel(force);
	}

	hideAbilityPanel(force) {
		// check if ability was clicked but no target chosen
		if (this.abilityCurrentlyClicked && !force) {
			// dont hide 
		} else {
			this.hoveredAbility = null;
			this.hoveredAbilityCooldown = null;
			this.chosenAbility = null;
		}
	}

	// even though they're shown on the same reel,
	// ordering effects and dummyEffects act independently
	// as finding an effectID with "ABILITY" will look to 
	// secondary array (holding turn ability order separately)

	addAbilityToReel(ability) {
		this.payCostTemporary(ability);
		let tempEffect = new BattleEffect();
		tempEffect.instanceId = -1;
		tempEffect.avatarUrl = ability.abilityUrl;
		tempEffect.name = ability.name;
		this.turnEffects.push(tempEffect);
		if(this.isReelEmpty) {
			this.isReelEmpty = false;
		}
		this.activeCharacterPosition = -1;
	}

	removeAbilityFromReel(effect : BattleEffect) {
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
		
		this.sendCostCheck();
	}

	drop(event: CdkDragDrop<string[]>) {
		moveItemInArray(this.turnEffects, event.previousIndex, event.currentIndex);
	}

	getAbilityPosition(ally, num) {
		let index = this.tempAllies.findIndex(c => {
			c.id = ally.id;
		})
		return (index * 4) + (num - 1);
	}

	showAbilityInfo(ally, pos) {

		let ability;

		if (pos === 1) {
			ability = ally.slot1;
		} else if (pos === 2) {
			ability = ally.slot2;
		} else if (pos === 3) {
			ability = ally.slot3;
		} else if (pos === 4) {
			ability = ally.slot4;
		}

		
		let abilityPosition = this.getAbilityPosition(ally, pos);

		if (this.abilityCurrentlyClicked) {
			// dont mess with info already there
		} else {
			this.hoveredAbility = ability;
			this.hoveredAbilityCooldown = this.getAbilityLocationCooldown(abilityPosition);
		}
	}


	// ======================================================================================================================
	// ------ EFFECTS -------------------------------------------------------------------------------------------------------
	// ======================================================================================================================

	effectStringParser(effect : Effect) : String {
		let stringArray = [];
		let durationString = '';
		let zero;
		let one;
		let two;
		let three;
		let four;
		zero = effect.name;
		one = effect.description;

		if (effect.duration === -1 ) {
			durationString = 'Infinite';
		} else if (effect.duration === 999) {
			durationString = 'Ends This Turn';
		} else if (effect.duration === 995) {
			durationString = 'Ends This Turn';
		} else if (effect.duration === 1) {
			durationString = effect.duration + ' more Turn'
		} else {
			durationString = effect.duration + ' more Turns'
		}
		
		two = 'Duration : ' + durationString

		if (effect.stacks) {
			let stacks = effect.quality.charAt(effect.quality.length - 1);
			three = 'Stacks: ' + stacks;
		}

		if (effect.interruptable) {
			four = 'Interruptable';
		}

		stringArray.push(zero);
		stringArray.push(one);
		stringArray.push(two);
		stringArray.push(three);
		stringArray.push(four);

		let final = stringArray.join(' \n ');
		// console.log(final);
		return final;
	}

	parseHiddenEffects(character : CharacterInstance) : Array<Effect> {
		let effects = [];
		for (let e of character.effects) {
			if (e.visible) {
				effects.push(e);
				// add it
			} else {
				if (!this.isPlayerOne && e.originCharacter > 2) {
					effects.push(e);
					// add it if it's ours
				}
				if (this.isPlayerOne && e.originCharacter < 3) {
					effects.push(e);
					// add it if it's ours
				}
			}
		}

		return effects;
	}

	// ======================================================================================================================
	// ------ SEND MESSAGES -------------------------------------------------------------------------------------------------
	// ======================================================================================================================

	// WTF LOGAN 
	sendMatchMakingMessage() {
		let msg = {
			type: "MATCH_MAKING",
			char1: this.allies[0].id,
			char2: this.allies[1].id,
			char3: this.allies[2].id,
			playerId: this.player.id,
			arenaId: this.arenaId
		};
		this.webSocket.send(JSON.stringify(msg));
	}

	allyAbilitiesCosts() : Array<Array<String>> {
		let alliedAbilities = [];
		for (let c of this.filterAllies()) {
			alliedAbilities.push(c.slot1);
			alliedAbilities.push(c.slot2);
			alliedAbilities.push(c.slot3);
			alliedAbilities.push(c.slot4);

		};
		console.log(alliedAbilities);
		return alliedAbilities.map(x => {
			return x.cost;
		});
	}

	// TODO
	// gotta do this any time they assign one target/ability too!
	// send ability id 
	sendCostCheck() {
		console.log("sending cost check");
		let costs = this.allyAbilitiesCosts();

		let costCheckDTO = {
			allyCosts : costs,
			chosenAbilities : this.chosenAbilities
		}
		console.log(costCheckDTO);
		const payload = {
			type: "COST_CHECK",
			playerId: this.player.id,
			costCheckDTO: costCheckDTO
		};
		
		this.webSocket.send(JSON.stringify(payload));
	}

	// TODO
	// just gotta do this when they click an active ability
	sendTargetCheck(dto : AbilityTargetDTO){
		this.webSocket.send(
			JSON.stringify({
				type: "TARGET_CHECK",
				playerId: this.player.id,
				abilityTargetDTO: dto
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

	areYouSure() {
		this.showAreYouSure = true;
	}

	youreNotSure() {
		this.showAreYouSure = false;
	}

	surrender() {
		// just manually kill my team and send turn end
		this.webSocket.send(
			JSON.stringify({
				type: "SURRENDER",
				playerId: this.player.id
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
		let abilityDTOs : Array<AbilityTargetDTO> = [];
		let effects : Array<BattleEffect> = this.turnEffects;

		let finalEffects : Array<BattleEffect> = [];

		console.log("TURN EFFECTS");
		console.log(this.turnEffects);
		console.log("AOE EFFECTS");
		console.log(this.aoeTurnEffects);
		for (let i = 0; i < effects.length; i++) {
			let efct = effects[i];
			let existingEffect = this.aoeTurnEffects.get(efct.groupId);

			if (existingEffect) {
				// parse and add back all existing effects, and check for ghost AOE effects floating
				for (let aoeEffect of existingEffect) {

					finalEffects.push(aoeEffect);
					// if (name === aoeEffect.name && !isAoe) {
					// 	isAoe = true;
					// } else if (name === aoeEffect.name && isAoe){
					// 	console.log(aoeEffect);
					// 	finalEffects.push(aoeEffect);
					// }else {
					// 	// god I hope i don't have to come back here
					// 	// basically only push one single-target effect, the backend handles the rest
					// 	// aoes need to push all three tho
					// }
				}
			} else {
				// this should always be a mock
				this.chosenAbilities.forEach(adto => {
					// this reorders the chosenAbilities output to match the turnEffects
					if (adto.ability.name == efct.name) {
						abilityDTOs.push(adto);
					}
				})
				console.log(efct);
				finalEffects.push(efct);
			}
		}

		console.log("Final EFFECTS");
		console.log(finalEffects);

		// BUILD DTO HERE

		let battleTurnDTO : BattleTurnDTO = {
			spentEnergy : spentEnergy,
			abilities : abilityDTOs,
			effects : finalEffects
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
		// CLEAN UP everything
	}

	cleanUpPhase() {
		this.isReelEmpty = true;
		this.abilityCurrentlyClicked = false;
		this.chosenAbility = null;
		this.hoveredAbility = null;
		this.chosenAbilities = [];
		this.turnEffects = [];
		this.aoeTurnEffects = new Map();
		this.availableTargets = [];
		this.randomsNeeded = 0;
		this.randomsAreNeeded = false;
		this.allyCostFlag1 = false;
		this.allyCostFlag2 = false;
		this.allyCostFlag3 = false;
		this.showAreYouSure = false;
		this.stopAudio();
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
				this.inBattle = this.arenaService.isInBattle();
			} else if (mtp === "CCHECK") {
				this.handleCostCheckResponse(msg);
			} else if (mtp === "TCHECK") {
				this.handleTargetCheckResponse(msg);
			} else if (mtp === "ETRADE") {
				this.handleEnergyTradeResponse(msg);
			} else if (mtp === "END") {
				this.handleTurnEndResponse(msg);
			} else if (mtp === "SURRENDER") {
				this.handleSurrenderResponse(msg);
			} else {
				if (msg !== "WAITING FOR OPPONENTS"){
					console.log("UNRECOGNIZED");
				}
			}
		}
	}
  
	handleInitResponse(msg) {
		this.arenaService.setIsPlayerOne(msg.battle.playerIdOne === this.player.id);
		this.isPlayerOne = this.arenaService.getIsPlayerOne();
		if (this.isPlayerOne){
			this.player = msg.playerOne;
			this.opponent = msg.playerTwo;

			this.arenaService.setState(msg.battle, this.opponent);
			this.inBattle = this.arenaService.isInBattle();
			this.battle = this.arenaService.getCurrentBattle();

			let holder : Array<Character> = new Array();
			holder.push(msg.characters[3]);
			holder.push(msg.characters[4]);
			holder.push(msg.characters[5]);
			this.arenaService.setEnemies(holder);
			this.enemies = this.arenaService.getEnemies();

			this.arenaService.setBattleAllies(this.battle.playerOneTeam);
			this.battleAllies = this.arenaService.getBattleAllies();
			this.arenaService.setBattleEnemies(this.battle.playerTwoTeam);
			this.battleEnemies = this.arenaService.getBattleEnemies();

			this.arenaService.setEnergy(this.battle.playerOneEnergy);
			this.setTurnEnergy(this.arenaService.getEnergy());

			this.arenaService.setSpent(this.newMap());
			this.setSpentEnergy(this.arenaService.getSpent());
			
			if (this.battle.playerOneStart) {
				this.arenaService.setHasTurn(true);
				this.hasTurn = this.arenaService.getHasTurn();
			} else {
				this.arenaService.setHasTurn(false);
				this.hasTurn = this.arenaService.getHasTurn();
			}
		
		} else {
			this.player = msg.playerTwo;
			this.opponent = msg.playerOne;

			this.arenaService.setState(msg.battle, this.opponent);
			this.inBattle = this.arenaService.isInBattle();
			this.battle = this.arenaService.getCurrentBattle();

			let holder : Array<Character> = new Array();
			holder.push(msg.characters[0]);
			holder.push(msg.characters[1]);
			holder.push(msg.characters[2]);
			this.arenaService.setEnemies(holder);
			this.enemies = this.arenaService.getEnemies();

			this.arenaService.setBattleAllies(this.battle.playerTwoTeam);
			this.battleAllies = this.arenaService.getBattleAllies();
			this.arenaService.setBattleEnemies(this.battle.playerOneTeam);
			this.battleEnemies = this.arenaService.getBattleEnemies();

			this.arenaService.setEnergy(this.battle.playerTwoEnergy);
			this.setTurnEnergy(this.arenaService.getEnergy());

			this.arenaService.setSpent(this.newMap());
			this.setSpentEnergy(this.arenaService.getSpent());

			if (!this.battle.playerOneStart) {
				this.arenaService.setHasTurn(true);
				this.hasTurn = this.arenaService.getHasTurn();
			} else {
				this.arenaService.setHasTurn(false);
				this.hasTurn = this.arenaService.getHasTurn();
			}
		}

		console.log(this.allies);
		this.arenaService.setTempAllies(Object.create(this.allies));
		this.tempAllies = this.arenaService.getTempAllies();

		if (this.hasTurn) {
			this.sendCostCheck();
		} else {
			this.disableAbilities();
		}

	}


	handleEnergyTradeResponse(msg) {
		// TODO
		console.log("GOT ENERGY TRADE RESPONSE");
		this.arenaService.setBattle(msg.battle);
		this.battle = this.arenaService.getCurrentBattle();
		if (this.isPlayerOne) {
			this.arenaService.setEnergy(this.battle.playerOneEnergy)
			this.setTurnEnergy(this.arenaService.getEnergy());
		} else {
			this.arenaService.setEnergy(this.battle.playerTwoEnergy)
			this.setTurnEnergy(this.arenaService.getEnergy());
		}
		
		this.arenaService.setSpent(this.newMap());
		this.setSpentEnergy(this.arenaService.getSpent());
		this.energyTrade = null;
		// do another cost check 
		this.sendCostCheck();
	}
  
	handleCostCheckResponse(msg) {
		console.log("GOT COST CHECK RESPONSE");
		this.availableAbilities = msg.usable;

		// array of numbers to enable, and -1's to ignore
		// number of randoms needed after this move
		// optional response 
		// recieve message from backend, and disable abilities that we do not have enough energy for
	}

	handleTargetCheckResponse(msg) {
		console.log("GOT TARGET CHECK RESPONSE");
		this.availableTargets = msg.dto.targetPositions;
		//TODO
		// recieve message from backend, and highlight appropriate available targets
	}
	

	handleSurrenderResponse(msg) {
		let victory;
		console.log("GOT SURRENDER RESPONSE");
		if (this.player.id === msg.playerId) {
			victory = false;
			this.arenaService.setState(null, null);
		} else {
			victory = true;
			this.arenaService.setState(null, null);
		}
		
		if(victory) {
			this.playAudio("victory");
			alert("YOU HAVE WON");
		} else {
			this.playAudio("loss");
			alert("YOU HAVE LOST");
		}
	}
  
  
	// this is where we "START our turn", but we have to resolve a lot of stuff from backend first
	handleTurnEndResponse(msg) {
		if (msg.playerId === this.player.id) {
			console.log("You ended your turn");
			this.cleanUpPhase();
		} else {
			console.log("They ended their turn");
		}

		for (let ch of this.battle.playerOneTeam) {
			for (let chNew of msg.battle.playerOneTeam) {
				if (ch.position == chNew.position) {
					if (!ch.dead && chNew.dead) {
						this.playAudio("die");
					}
				}
			}
		}

		for (let ch of this.battle.playerTwoTeam) {
			for (let chNew of msg.battle.playerTwoTeam) {
				if (ch.position == chNew.position) {
					if (!ch.dead && chNew.dead) {
						this.playAudio("die");
					}
				}
			}
		}

		this.arenaService.setHasTurn(!this.hasTurn);
		this.hasTurn = this.arenaService.getHasTurn();
		this.arenaService.setBattle(msg.battle);
		this.battle = this.arenaService.getCurrentBattle();


		if (this.isPlayerOne) {
			this.arenaService.setBattleAllies(this.battle.playerOneTeam);
			this.battleAllies = this.arenaService.getBattleAllies();
			this.arenaService.setBattleEnemies(this.battle.playerTwoTeam);
			this.battleEnemies = this.arenaService.getBattleEnemies();

			this.arenaService.setEnergy(this.battle.playerOneEnergy);
			this.setTurnEnergy(this.arenaService.getEnergy());

			this.arenaService.setSpent(this.newMap());
			this.setSpentEnergy(this.arenaService.getSpent());
			this.refreshTradeState();

		} else {
			this.arenaService.setBattleAllies(this.battle.playerTwoTeam);
			this.battleAllies = this.arenaService.getBattleAllies();
			this.arenaService.setBattleEnemies(this.battle.playerOneTeam);
			this.battleEnemies = this.arenaService.getBattleEnemies();

			this.arenaService.setEnergy(this.battle.playerTwoEnergy);
			this.setTurnEnergy(this.arenaService.getEnergy());

			this.arenaService.setSpent(this.newMap());
			this.setSpentEnergy(this.arenaService.getSpent());
			this.refreshTradeState();
		}

		if (!this.hasTurn) {
			this.filterAllies();
		}
		console.log(this.battleAllies);
		console.log(this.battleEnemies);

		
		let defeat = true;
		for(let instance of this.battleAllies) {
			if (!instance.dead) {
				defeat = false;
				this.arenaService.setState(null, null);
			}
		}
		
		let victory = true;
		for(let instance of this.battleEnemies) {
			if (!instance.dead) {
				victory = false;
				this.arenaService.setState(null, null);
			}
		}
		if(defeat) {
			this.playAudio("loss");
			alert("YOU HAVE LOST");
		}
		if(victory) {
			this.playAudio("victory");
			alert("YOU HAVE WON");
		}


		// Cost check
		if (this.hasTurn) {
			this.checkForAoes();
			this.sendCostCheck();
		} else {
			this.disableAbilities();
		}

		// check and perform damage (might happen automatically with battle? idk)

		// apply effects visually (not sure how much this is, maybe effect bubbles)

		// kill characters (this is the only one I'm sure I have to do, ALSO SOUND EFFECT)
		this.countdown.restart();
	}

	checkForAoes() {
		// gotta populate a map of <instanceID, effect> so we dont show AOE more than once on turnEffects // TODO:
		for(let ally of this.battleAllies) {
			if(ally.effects.length > 0) {
				for(let effect of ally.effects.values()) {
					if((effect.originCharacter > 2 && !this.isPlayerOne) || (effect.originCharacter < 3 && this.isPlayerOne)) {
						if (this.aoeTurnEffects.get(effect.groupId) != null) {
							let old = this.aoeTurnEffects.get(effect.groupId);
							old.push(effect);
							this.aoeTurnEffects.set(effect.groupId, old);
						} else {
							let effects = [];
							effects.push(effect);
							this.aoeTurnEffects.set(effect.groupId, effects);
						}
					}
				}
			}
		}

		for(let enemy of this.battleEnemies) {
			if(enemy.effects.length > 0) {
				for(let effect of enemy.effects.values()) {
					if((effect.originCharacter > 2 && !this.isPlayerOne) || (effect.originCharacter < 3 && this.isPlayerOne)) {
						if (this.aoeTurnEffects.get(effect.groupId) != null) {
							let old = this.aoeTurnEffects.get(effect.groupId);
							old.push(effect);
							this.aoeTurnEffects.set(effect.groupId, old);
						} else {
							let effects = [];
							effects.push(effect);
							this.aoeTurnEffects.set(effect.groupId, effects);
						}
					}
				}
			}
		}

		console.log(this.aoeTurnEffects);
		this.aoeTurnEffects.forEach((v) => {
			console.log(v);
			let effect = v[0];
			this.turnEffects.push(effect);
			if (this.isReelEmpty) {
				this.isReelEmpty = false;
			}
		});
		
	}

}
