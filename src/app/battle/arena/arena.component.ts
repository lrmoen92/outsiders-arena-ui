import { AfterViewChecked, AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Battle, Character, Player, CharacterInstance, BattleTurnDTO, AbilityTargetDTO, Ability, Effect, BattleEffect, Portrait} from 'src/app/model/api-models';
import { URLS, serverPrefix } from 'src/app/utils/constants';
import { CountdownComponent, CountdownConfig, CountdownEvent } from 'ngx-countdown';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import { faVolumeUp } from '@fortawesome/free-solid-svg-icons';
import { ArenaStore } from 'src/app/utils/arena.store';
import { CharacterStore } from 'src/app/utils/character.store';
import { LoginStore } from 'src/app/utils/login.store';
import { BehaviorSubject, Observable } from 'rxjs';

import { interval } from 'rxjs';
import { map } from 'rxjs/operators'

@Component({
  selector: 'arena-root',
  templateUrl: './arena.component.html',
  styleUrls: ['./arena.component.css']
})
export class ArenaComponent implements OnInit, AfterViewChecked {

	// ======================================================================================================================
	// ------ PROPERTIES ----------------------------------------------------------------------------------------------------
	// ======================================================================================================================

	@ViewChild('countdown', {static: false}) private 
	countdown: CountdownComponent;
	config: CountdownConfig;

	time: number;
	
    _countdownReset: BehaviorSubject<boolean> = new BehaviorSubject(false);
    countdownReset: Observable<boolean> = this._countdownReset.asObservable();

	@Input()
	inBattle : boolean = false;

	loginStore : LoginStore;
	characterStore : CharacterStore;
	arenaStore : ArenaStore;
	
	opponentName : string;

	battle : Battle;
	player : Player;
	opponent : Player;

	hasTurn : boolean = false;
	isPlayerOne : boolean = false;

	allies : Array<Character> = [];
	tempAllies : Array<Character> = [];

	battleAllies : Array<CharacterInstance> = [];
	battleEnemies : Array<CharacterInstance> = [];



	totalEnergy : number = 0;
	totalSpentEnergy : number = 0;

	turnEnergy : Map<string, number> = new Map();

	turnStrength : Array<string> = [];
	turnDexterity : Array<string> = [];
	turnArcana : Array<string> = [];
	turnDivinity : Array<string> = [];

	spentEnergy : Map<string, number> = new Map();

	spentStrength : Array<string> = [];
	spentDexterity : Array<string> = [];
	spentArcana : Array<string> = [];
	spentDivinity : Array<string> = [];

	randomCap = 0;
	lockedStr = 0;
	lockedDex = 0;
	lockedArc = 0;
	lockedDiv = 0;

	energyTrade : string;

	randomsAreNeeded : boolean = false;
	randomsNeeded : number = 0;

	availableAbilities : Map<string, number> = new Map();
	lockedAbilities : Array<number> = [];

	hoveredAbility : Ability = null;
	hoveredAbilityCooldown: number;

	// V identified by effectID, or -1
	turnEffects : Array<BattleEffect> = [];
	chosenAbilities : Array<AbilityTargetDTO> = [];

	activeCharacterPosition : number = -1;
	chosenAbility: Ability;
	availableTargets: Array<number> = [];
	abilityCurrentlyClicked: boolean;



	aoeTurnEffects : Map<number, Array<BattleEffect>> = new Map();

	playingAudio: HTMLAudioElement;
	secondaryAudio: HTMLAudioElement;
	backingAudio: HTMLAudioElement;
	faVolumeUp = faVolumeUp;
	volume: number = 0.5;

	@Input()
	characterPortraits: Map<number, Portrait> = new Map();

	battlePortraits: Map<string, Portrait> = new Map();
	imgPrefix : string = serverPrefix;
	showAreYouSure: boolean;

	// ======================================================================================================================
	// ------ LIFECYCLE -----------------------------------------------------------------------------------------------------
	// ======================================================================================================================

	constructor(
		characterStore : CharacterStore,
		arenaStore : ArenaStore
	) {
		this.characterStore = characterStore;
		this.arenaStore = arenaStore;
	}

	ngOnInit() {
		this.config = this.countdownConfigFactory();
		
		this.arenaStore.getPlayer().subscribe( x => {
			if (x) {
				this.player = x;
			}
		})

		this.arenaStore.getOpponent().subscribe( x => {
			if (x) {
				this.opponent = x;
			}
		})

		this.arenaStore.getTempAllies().subscribe( x => {
			if (x) {
				this.tempAllies = x;
			}
		})
		this.subscribeToBattle();
	}

	ngAfterViewChecked() {
		// this.countdownReset.subscribe( x => {
		// 	if (x) {
		// 		this.restartCountdown();
		// 	}
		// })
	}


	subscribeToBattle() {		
		this.arenaStore.getBattle().subscribe(x => {
			if (x) {

				console.log(x);
				this.battle = x;

				if (this.battle.turn === 0) {
					this.isPlayerOne = this.player.id === this.battle.playerIdOne;
				}

				let team = this.isPlayerOne ? this.battle.playerOneTeam : this.battle.playerTwoTeam;
				let enemies = this.isPlayerOne ? this.battle.playerTwoTeam : this.battle.playerOneTeam;

				if (this.battle.turn === 0) {
					for(let c of team) {
						let portrait : Portrait = this.characterPortraits.get(c.characterId);
						let battlePortrait : Portrait = Object.assign(portrait);
						this.battlePortraits.set(c.characterId + (c.playerOneCharacter ? "o" : "t"), battlePortrait);
					}
					for(let c of enemies) {
						let portrait : Portrait = this.characterPortraits.get(c.characterId);
						let battlePortrait : Portrait = Object.assign(portrait);
						this.battlePortraits.set(c.characterId + (c.playerOneCharacter ? "o" : "t"), battlePortrait);
					}
				}

				for (let c of this.battleAllies) {
					for (let d of team) {
						if (c.position == d.position) {
							if (!c.dead && d.dead) {
								this.playAudio("die");
							}
						}
					}
				}
	
				for (let c of this.battleEnemies) {
					for (let d of enemies) {
						if (c.position == d.position) {
							if (!c.dead && d.dead) {
								this.playAudio("die");
							}
						}
					}
				}
	
				this.battleAllies = team;
				this.battleEnemies = enemies;
				this.filterEffects(this.battleAllies, this.battleEnemies);

				let energy = this.isPlayerOne ? this.battle.playerOneEnergy : this.battle.playerTwoEnergy;

				this.cleanTurnEnergy();
				this.turnEnergy = this.copyMapOld(energy);
	
				let str = this.turnEnergy.get("STRENGTH");
				let dex = this.turnEnergy.get("DEXTERITY");
				let arc = this.turnEnergy.get("ARCANA");
				let div = this.turnEnergy.get("DIVINITY");
	
				this.totalEnergy = str + dex + arc + div;
	
				for (let i = 0; i < str; i++) {
					this.turnStrength.push("STRENGTH");
				}
				for (let i = 0; i < dex; i++) {
					this.turnDexterity.push("DEXTERITY");
				}
				for (let i = 0; i < arc; i++) {
					this.turnArcana.push("ARCANA");
				}
				for (let i = 0; i < div; i++) {
					this.turnDivinity.push("DIVINITY");
				}

				this.cleanSpentEnergy();
				this.spentEnergy = this.newMap();

				let strS = this.spentEnergy.get("STRENGTH");
				let dexS = this.spentEnergy.get("DEXTERITY");
				let arcS = this.spentEnergy.get("ARCANA");
				let divS = this.spentEnergy.get("DIVINITY");

				this.totalSpentEnergy = strS + dexS + arcS + divS;

				for (let i = 0; i < strS; i++) {
					this.spentStrength.push("STRENGTH");
				}
				for (let i = 0; i < dexS; i++) {
					this.spentDexterity.push("DEXTERITY");
				}
				for (let i = 0; i < arcS; i++) {
					this.spentArcana.push("ARCANA");
				}
				for (let i = 0; i < divS; i++) {
					this.spentDivinity.push("DIVINITY");
				}

				let iStarted : boolean = 
					(this.isPlayerOne && this.battle.playerOneStart) ||
					(!this.isPlayerOne && !this.battle.playerOneStart);

				this.hasTurn = 
					((this.battle.turn % 2 === 0) && iStarted) ||
					((this.battle.turn % 2 !== 0) && !iStarted);

				console.log("Is Player One: " + this.isPlayerOne);
				console.log("Player One Started: " + this.battle.playerOneStart);
				console.log("I Started: " + iStarted);
				console.log("Has Turn: " + this.hasTurn);
				// can determine hasTurn or Not based on turn # and who started

				console.log("::JUST " + (this.hasTurn ? "STARTED" : "ENDED") +" MY TURN");
				if (this.hasTurn) {
					this.sendCostCheck();
				} else {
					this.cleanUpPhase();
				}
				this.startTimer();
			}
		})


		this.arenaStore.getAvailableAbilities().subscribe(x => {
			if (x) {
				if (x.length > 0) {
					console.log("got new available abilities" + x);
					this.availableAbilities = new Map();
					this.allyAbilities().forEach((a, index) => {
						this.availableAbilities.set(a.name, x[index])
					});
				}
			}
		})

		this.arenaStore.getAvailableTargets().subscribe(x => {
			if (x) {
				if (x.length > 0) {
					this.availableTargets = x;
					this.updateCharacterStyles();
				}
			}
		})

		// this.arenaStore.getVictory().subscribe(x => {
		// 	if (x) {
		// 		this.playAudio("victory");
		// 		alert("YOU HAVE WON");
		// 	}
		// })
		



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
	// ------ TIMER --------------------------------------------------------------------------------------------------------
	// ======================================================================================================================

	startTimer() {
		interval(1000).pipe(
		  map((x) => { 
			  // MAKE this.time an observable, and subscribe to it ??
			  this.time = 60 - x;
		  })
		);
	}

	stopTimer() {

	}

	resetTimer() {

	}

	countdownConfigFactory(): CountdownConfig {
		return {
			notify: [8],
			format: `s`,
			leftTime: 60
		};
	}

	handleTimerEvent(event: CountdownEvent) {
		console.log(event);
		if(event.action === "start") {
			this.onStart();
		} else if (event.action === "restart" && this.hasTurn) { 
			this.onStart();
		} else if (event.action === "notify" && this.hasTurn) {
			this.playAudio("timerlow");
		} else if (event.action === "done") {
			this.onStop();
		}
	}

	onStart() {
		this.playAudio("yourturn");
	}

	onStop() {
		// force turn end and clean up
		if (this.hasTurn) {
			if (this.randomsNeeded > 0) {
				this.clearAbilities();
				this.clearSelection(true);
			}
			this.sendTurnEndMessage();
		}
	}

	// ======================================================================================================================
	// ------ ENERGY --------------------------------------------------------------------------------------------------------
	// ======================================================================================================================

	newMap() {
		let temp : Map<string, number> = new Map();
		temp.set("STRENGTH", 0);
		temp.set("DEXTERITY", 0);
		temp.set("ARCANA", 0);
		temp.set("DIVINITY", 0);
		return temp;
	}

	copyMap(a : Map<string, number>) {
		let temp : Map<string, number> = new Map();
		temp.set("STRENGTH", a.get("STRENGTH"));
		temp.set("DEXTERITY", a.get("DEXTERITY"));
		temp.set("ARCANA", a.get("ARCANA"));
		temp.set("DIVINITY", a.get("DIVINITY"));
		return temp;
	}

	copyMapOld(a : any) {
		let temp : Map<string, number> = new Map();
		temp.set("STRENGTH", a["STRENGTH"]);
		temp.set("DEXTERITY", a["DEXTERITY"]);
		temp.set("ARCANA", a["ARCANA"]);
		temp.set("DIVINITY", a["DIVINITY"]);
		return temp;
	}


	spendEnergy(energy : string, force : boolean) {
		console.log("CLICKED");
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
		let temp : Map<string, number> = this.copyMap(this.turnEnergy);

		let oldVal = temp.get(energy)
		temp.set(energy, oldVal - 1);
		
		let temp2 : Map<string, number> = this.copyMap(this.spentEnergy);

		let oldVal2 = temp2.get(energy);
		temp2.set(energy, oldVal2 + 1);

		this.setTurnEnergy(temp);
		this.setSpentEnergy(temp2);
	}

	// only for refunding abilities I guess
	returnEnergy(energy : string, force : boolean) {
		
		if(energy === "RANDOM") {
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
	
	
				let temp : Map<string, number> = this.copyMap(this.turnEnergy);

				let oldVal = temp.get(energy)
				temp.set(energy, oldVal + 1);
				
				let temp2 : Map<string, number> = this.copyMap(this.spentEnergy);
		
				let oldVal2 = temp2.get(energy);
				temp2.set(energy, oldVal2 - 1);
		
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

	removeOneRandomEnergy() {

		if (this.spentEnergy.get("STRENGTH") > this.lockedStr) {
			this.returnEnergy("STRENGTH", true);
		} else if (this.spentEnergy.get("DEXTERITY") > this.lockedDex) {
			this.returnEnergy("DEXTERITY", true);
		} else if (this.spentEnergy.get("ARCANA") > this.lockedArc) {
			this.returnEnergy("ARCANA", true);
		} else if (this.spentEnergy.get("DIVINITY") > this.lockedDiv) {
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
					this.removeOneRandomEnergy();
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


	filterEffects(battleAllies, battleEnemies) {
		// gotta populate a map of <instanceID, effect> so we dont show AOE more than once on turnEffects // TODO:
		for(let ally of battleAllies) {
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
	
		for(let enemy of battleEnemies) {
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
	
		// pushes one instance of each ability for slider, even if multiple targets
		this.aoeTurnEffects.forEach((v) => {
			this.turnEffects.push(v[0]);
		});
		
	}
	
	filterAbilities(battleAllies) {
		let newAllies = [];
		
		for (let ally of this.allies) {
		for (let battleAlly of battleAllies) {
			if (ally.id === battleAlly.characterId) {
	
			let tempAlly : Character = JSON.parse(JSON.stringify((ally)));
	
			for (let effect of battleAlly.effects) {
	
				if (effect.statMods["COST_CHANGE"] !== null) {
	
				let num = effect.statMods["COST_CHANGE"];
				if (num > 0) {
					for (let i = num; i > 0; i--) {
					tempAlly.abilities.forEach(a => {
						a.cost.push("RANDOM");
					})
					}
				} else if (num < 0) {
					for (let i = num; i < 0; i++) {
					tempAlly.abilities.forEach(a => {
						if (a.cost.includes("RANDOM")) {
						a.cost.splice(a.cost.findIndex(e => {return e === "RANDOM"}), 1);
						}
					})
					}
				}
				}
			}
	
			newAllies.push(tempAlly);
			}
		}
		}
	
		this.tempAllies = newAllies;
	}

	getCharacterPosition(string) {
		let ans;
		this.allyAbilities().forEach((x, y, z) => {
			// TODO: THIS IS WRONG why targets are broken
			if (x.name === string) {
				ans = Math.floor(y/4) + (this.isPlayerOne ? 0 : 3);
			}
		})
		return ans;
	}

	updateCharacterStyles() {
		this.updateAllyStyles();
		this.updateEnemyStyles();
	}

	updateAllyStyles() {
		for(let c of this.battleAllies) {
			this.updateCharacterStyle(c);
		}
	}

	updateEnemyStyles() {
		for(let c of this.battleEnemies) {
			this.updateCharacterStyle(c);
		}
	}

	updateCharacterStyle(c) {
		this.battlePortraits.forEach((portrait, id) => {
			// TODO: THIS IS FUCKY TOOO
			if (id === (c.characterId + (c.playerOneCharacter ? "o" : "t"))) {
				portrait.style = this.getCharacterStyle(c.position);
			}
		})
	}

	getCharacterPortrait(character): Portrait {
		if (this.battlePortraits.size > 0) {
			return this.battlePortraits.get(character.characterId + (character.playerOneCharacter ? 'o' : 't'));
		} else {
			return new Portrait();
		}
	}

	getCharacterStyle(characterPosition) {
		if (this.availableTargets) {
			if (this.isTargetLocationLocked(characterPosition)) {
				return {'opacity': 0.2};
			} else {
				return {'opacity': 1};
			}
		}
	}

	getAbilityStyle(ability) {
		// console.log("Getting ability style : " + ability.name);
		if (this.isAbilityLocked(ability)) {
			return {'opacity': 0.2};
		} else {
			return {'opacity': 1};
		}
    }
	
	getAbilityCooldown(ability) : number  {
		if(this.isAbilityLocked(ability)){
			return -1 - this.getAbilityStatus(ability);
		} else {
			return 0;
		}	
	}

	
	isAbilityLocked(ability) {
		if(this.getAbilityStatus(ability) < 0) {
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
			return true;
		}

	}

	getAbilityStatus(ability) {
		if (this.availableAbilities.size > 0) {
			return this.availableAbilities.get(ability.name);
		} else {
			return -1;
		}
	}


	disableAbilities() {
		this.allyAbilities().forEach((a) => {
			this.availableAbilities.set(a.name, -1);
		})
	}
	

	clickAbility(ability) {

		if (this.abilityCurrentlyClicked) {
			
		} else if (this.isAbilityLocked(ability)) {
			alert("Can't use that now!")
		} else if(this.totalSpentEnergy > 0 && !this.abilitiesAreChosen()) {
			alert("Finish your energy trade or put your spent energy back before choosing abilities!")
		} else {
			this.setChosenAbility(ability)
			this.setActiveCharacterPosition(this.getCharacterPosition(ability.name));
			this.abilityCurrentlyClicked = true;
			this.sendTargetCheck();
		}
	}


	clickTarget(targetLocation) {
		if (this.isTargetLocationLocked(targetLocation)) {
			alert("That character can't be targeted with this ability!");
		} else if (this.chosenAbility) {

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

			this.confirmAbility(this.chosenAbility, tarArray, this.activeCharacterPosition, this.chosenAbilities);

			// this.sendCostCheck();
		} else {
			// TODO:
			// clicking targets should show character blurb normally (duh)
		}
	}

	clickCancel() {
		if (this.abilityCurrentlyClicked) {
			this.clearSelection(false);
		}
	}

    confirmAbility(chosenAbility, tarArray, activeCharacterPosition, chosenAbilities) {

		// form and add AbiltyTargetDTOS to array
			  let dto = new AbilityTargetDTO;
			  dto.ability = chosenAbility;
			  dto.targetPositions = tarArray;
			  dto.characterPosition = activeCharacterPosition;
  
		// add DTO for backend call, gets sent at the end!!! (got it)
		chosenAbilities.push(dto);
		// add ability to UI
		this.addAbilityToReel(chosenAbility);
		this.clearSelection(false);
	  }

	clearSelection(force) {
		this.abilityCurrentlyClicked = false;
		this.activeCharacterPosition = -1;
		this.arenaStore.setAvailableTargets([0, 1, 2, 3, 4, 5]);
		this.hideAbilityPanel(force);
	}

	clearAbilities() {
		if (this.totalSpentEnergy > 0) {
		  if (this.isPlayerOne) {
			this.setTurnEnergy(this.battle.playerOneEnergy);
		  } else {
			this.setTurnEnergy(this.battle.playerTwoEnergy);
		  }
		  this.setSpentEnergy(this.newMap());
		  this.refreshTradeState();
		}
		this.setChosenAbilities([]);
		// filter out dtos from turn effects

		this.setTurnEffects(
			this.turnEffects.filter( x => {
				x.instanceId !== -1;
			})
		);
	  }

	  isReelEmpty() {
		  return (this.chosenAbilities.length > 0) || (this.turnEffects.length > 0);
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
		this.setTurnEffects(this.turnEffects);
		this.setActiveCharacterPosition(-1);
	}

	removeAbilityFromReel(effect : BattleEffect) {
		if (effect.instanceId > 0) {
			// can't remove pre-existing conditions breh
			// TODO: add check here to remove or reorder some of these
		} else {
			var index = this.chosenAbilities.findIndex(a => a.ability.name==effect.name);
			let ability = this.chosenAbilities[index].ability;
			var index2 = this.turnEffects.findIndex(e => (e.instanceId < 0 && e.name === effect.name));
	
			this.refundCostTemporary(ability);
			this.chosenAbilities.splice(index, 1);
			this.turnEffects.splice(index2, 1);
			this.setChosenAbilities(this.chosenAbilities);
			this.setTurnEffects(this.turnEffects);
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
			this.hoveredAbilityCooldown = this.getAbilityCooldown(ability);
		}
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

	sendCostCheck() {
		
		let allyAbilityCosts = [];
		for (let ability of this.allyAbilities()) {
			allyAbilityCosts.push(ability.cost);
		}
		this.arenaStore.sendCostCheck(allyAbilityCosts, this.chosenAbilities);
	}

	sendTargetCheck(){
		let dto : AbilityTargetDTO = {
			ability : this.chosenAbility,
			characterPosition : this.activeCharacterPosition,
			targetPositions : []
		}

		this.arenaStore.sendTargetCheck(dto);
	}

	sendEnergyTrade(energySpent : Map<String, number>, energyGained : string){

		this.arenaStore.sendEnergyTrade(energySpent, energyGained);
	}

	surrender() {

		this.arenaStore.surrender();
	}

	sendTurnEnd() {
		if (this.randomsNeeded > 0) {
			alert("More Energy Needed!");
		} else {
			this.sendTurnEndMessage();
		}
	}
	
	sendTurnEndMessage() {

		let abilityDTOs : Array<AbilityTargetDTO> = [];
		let effects : Array<BattleEffect> = this.turnEffects;

		let finalEffects : Array<BattleEffect> = [];

		for (let i = 0; i < effects.length; i++) {
			let efct = effects[i];
			let existingEffect = this.aoeTurnEffects.get(efct.groupId);

			if (existingEffect) {
				// parse and add back all existing effects, and check for ghost AOE effects floating
				for (let aoeEffect of existingEffect) {
					finalEffects.push(aoeEffect);
				}
			} else {
				// this should always be a mock
				this.chosenAbilities.forEach(adto => {
					// this reorders the chosenAbilities output to match the turnEffects
					if (adto.ability.name == efct.name) {
						abilityDTOs.push(adto);
					}
				})
				finalEffects.push(efct);
			}
		}

		this.arenaStore.sendTurnEndMessage(this.spentEnergy, abilityDTOs, finalEffects);
	}



	// ======================================================================================================================
	// ------ OTHER -----------------------------------------------------------------------------------------------
	// ======================================================================================================================

  
  
	cleanUpPhase() {
		this.abilityCurrentlyClicked = false;
		this.chosenAbility = null;
		this.hoveredAbility = null;
		this.aoeTurnEffects = new Map();
		this.randomsNeeded = 0;
		this.randomsAreNeeded = false;
		this.showAreYouSure = false;
		this.setSpentEnergy(this.newMap());
		this.setChosenAbilities([]);
		this.setTurnEffects([]);
		this.cleanEnergy();
		this.refreshTradeState();
		this.stopAudio();
		this.disableAbilities();
	}

	cleanTurnEnergy() {
		this.turnDivinity = [];
		this.turnArcana = [];
		this.turnDexterity = [];
		this.turnStrength = [];
	}

	cleanSpentEnergy() {
		this.spentDivinity = [];
		this.spentArcana = [];
		this.spentDexterity = [];
		this.spentStrength = [];
	}

	cleanEnergy() {
		this.cleanTurnEnergy();
		this.cleanSpentEnergy();
	}


	areYouSure() {
		this.showAreYouSure = true;
	}

	youreNotSure() {
		this.showAreYouSure = false;
	}

	allyAbilities() : Array<Ability> {
		let allAbilities = [];
		for (let ally of this.tempAllies) {
			for (let ability of ally.abilities) {
				allAbilities.push(ability);
			}
		}
		return allAbilities;
	}

	//===================
	// SETTERS
	//===================



    setBattleAllies(next) {
      this.battleAllies = next;
    }  


    setBattleEnemies(next) {
      this.battleEnemies = next;
    }
    

    setTurnEnergy(next) {
      this.turnEnergy = next;
    }    


    setSpentEnergy(next) {
      this.spentEnergy = next;
    }
    

    setTurnEffects(next) {
      this.turnEffects = next;
    }
        

    setChosenAbilities(next) {
      this.chosenAbilities = next;
    }


    setActiveCharacterPosition(next) {
      this.activeCharacterPosition = next;
    }


    setChosenAbility(next) {
      this.chosenAbility = next;
    }


}
