import { Component, Input, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Battle, Character, Player, CharacterInstance, BattleTurnDTO, AbilityTargetDTO, Ability, Effect, BattleEffect} from 'src/app/model/api-models';
import { URLS, serverPrefix } from 'src/app/utils/constants';
import { CountdownComponent, CountdownConfig, CountdownEvent } from 'ngx-countdown';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';

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

	imgPrefix : string = serverPrefix;

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

	activeCharacterPosition : Number = -1;
	hoveredAbility : Ability = null;

	alliedAbilities : Array<Ability> = [];
	availableAbilities : Array<Number> = [];
	chosenAbilities : Array<AbilityTargetDTO> = [];

	lockedAbilities : Array<Number> = [];

	// V identified by effectID, or -1
	turnEffects : Array<BattleEffect> = [];
	isReelEmpty : boolean = true;

	aoeTurnEffects : Map<Number, Array<BattleEffect>> = new Map();


	chosenAbility: Ability;
	chosenAbilityPosition : number;
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
	// ------ AUDIO ---------------------------------------------------------------------------------------------------------
	// ======================================================================================================================

	playAudio(sound : string){
		let audio = new Audio();
		audio.src = this.imgPrefix + "/assets/sounds/" + sound + ".wav";
		
		audio.load();
		audio.play();
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
				this.arenaId = <Number> x;
			},
			y => {

			},
			() => {
				this.connectByArenaId();
			}
		);
	}




	connectToQuick() {
		console.log('::Looking For Quick Match');
		this.httpClient.get(URLS.playerQuickArena + this.player.id + '/' + this.player.level)
		.subscribe(
			x => {
				this.arenaId = <Number> x;
			},
			y => {

			},
			() => {
				console.log(this.arenaId);
				this.connectByArenaId();
			}
		);
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
		(async () => { 
			// Do something before delay
			console.log('before delay')
	
			await this.delay(1000);
	
			// Do something after
			console.log('after delay')

			this.webSocket = new WebSocket(URLS.battleSocket + this.arenaId);
			this.webSocket.onopen = () => {
				this.handleMessage();
				this.sendMatchMakingMessage();
			}
			this.webSocket.onerror = (e) => {
				console.log(e);
			}
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
				return "TIMER: " + s + " SECONDS LEFT";
			}),
		};
	}

	handleTimerEvent(event: CountdownEvent) {
		console.log(event);
		if(event.action === "start" || event.action == "restart") {
			this.onStart();
		} else if (event.action === "notify" && event.left === 8000) {
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
				let holderArray = this.turnEffects.filter(e => {
					e.instanceId !== -1;
				});
				this.turnEffects = holderArray;
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

	clickAbility(ability, parentPosition, abilityPosition) {
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
			this.sendTargetCheck(dto);
		}
	}

	isAbilityLocationLocked(abilityLocation) : boolean  {
		if (this.availableAbilities[abilityLocation] === -1){
			return true;
		} else {
			return false;
		}
	}
	
	isTargetLocationLocked(charPos) : boolean  {
		if (this.availableTargets.length > 0) {
			if (this.availableTargets[charPos] === -1){
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

	getImageStyle(abilityLocation) {
		if (this.availableAbilities) {
			if (this.isAbilityLocationLocked(abilityLocation)) {
				return {'opacity': 0.2};
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


	showAbilityInfo(ability) {
		if (this.abilityCurrentlyClicked) {
			// dont mess with info already there
		} else {
			this.hoveredAbility = ability;
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
		console.log(final);
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
		return this.alliedAbilities.map(x => {
			return x.cost;
		})
	}

	// TODO
	// gotta do this any time they assign one target/ability too!
	// send ability id 
	sendCostCheck() {
		console.log("sending cost check");

		let costCheckDTO = {
			allyCosts : this.allyAbilitiesCosts(),
			chosenAbilities : this.chosenAbilities
		}

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
			this.alliedAbilities.push(c.slot1);
			this.alliedAbilities.push(c.slot2);
			this.alliedAbilities.push(c.slot3);
			this.alliedAbilities.push(c.slot4);
		}
		for (let c of this.enemies) {
			this.enemyPortraits.set(c.id, c.avatarUrl);
		}

		if (this.hasTurn) {
			this.sendCostCheck();
		} else {
			this.disableAbilities();
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

		this.hasTurn = !this.hasTurn;
		this.battle = msg.battle;

		if (this.isPlayerOne) {
			this.setTurnEnergy(this.battle.playerOneEnergy);
			this.setSpentEnergy(this.newMap());
			this.refreshTradeState();

			this.battleAllies = this.battle.playerOneTeam;
			this.battleEnemies = this.battle.playerTwoTeam;

		} else {
			this.setTurnEnergy(this.battle.playerTwoEnergy);
			this.setSpentEnergy(this.newMap());
			this.refreshTradeState();

			this.battleAllies = this.battle.playerTwoTeam;
			this.battleEnemies = this.battle.playerOneTeam;
		}

		console.log(this.battleAllies);
		console.log(this.battleEnemies);

		
		let defeat = true;
		for(let instance of this.battleAllies) {
			if (!instance.dead) {
				defeat = false;
			}
		}
		
		let victory = true;
		for(let instance of this.battleEnemies) {
			if (!instance.dead) {
				victory = false;
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
