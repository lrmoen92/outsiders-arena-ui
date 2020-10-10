import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Battle, Character, Player, CharacterInstance, BattleTurnDTO, AbilityTargetDTO, Ability, Effect, BattleEffect} from 'src/app/model/api-models';
import { URLS, serverPrefix } from 'src/app/utils/constants';
import { CountdownComponent, CountdownConfig, CountdownEvent } from 'ngx-countdown';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import { faVolumeUp } from '@fortawesome/free-solid-svg-icons';
import { CharacterService } from '../character/character.service';
import { ArenaService } from './arena.service';
import { LoginService } from '../login/login.service';
import { LoginStore } from '../login/login.store';
import { CharacterStore } from '../character/character.store';
import { ArenaStore } from './arena.store';

@Component({
  selector: 'arena-root',
  templateUrl: './arena.component.html',
  styleUrls: ['./arena.component.css']
})
export class ArenaComponent implements OnInit {

	// ======================================================================================================================
	// ------ PROPERTIES ----------------------------------------------------------------------------------------------------
	// ======================================================================================================================

	@ViewChild(CountdownComponent) private countdown: CountdownComponent;
	config: CountdownConfig;
	
	loginStore : LoginStore;
	characterStore : CharacterStore;
	arenaStore : ArenaStore;
	

	opponentName : string;
	arenaId : Number;


	connected : Boolean = false;
	inBattle : Boolean = false;


	battle : Battle;
	player : Player;
	opponent : Player;
	allCharacters : Array<Character>;

	hasTurn : Boolean = false;
	isPlayerOne : Boolean = false;

	allies : Array<Character> = [];
	tempAllies : Array<Character> = [];
	enemies : Array<Character> = [];

	battleAllies : Array<CharacterInstance> = [];
	battleEnemies : Array<CharacterInstance> = [];




	turnEnergy : Map<string, Number> = new Map();
	turnStrength : Array<string>;
	turnDexterity : Array<string>;
	turnArcana : Array<string>;
	turnDivinity : Array<string>;

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

	


	availableAbilities : Map<string, Number> = new Map();
	lockedAbilities : Array<Number> = [];

	hoveredAbility : Ability = null;
	hoveredAbilityCooldown: number;

	// V identified by effectID, or -1
	turnEffects : Array<BattleEffect> = [];
	chosenAbilities : Array<AbilityTargetDTO> = [];

	activeCharacterPosition : Number = -1;
	chosenAbility: Ability;
	availableTargets: Array<Number> = [];
	abilityCurrentlyClicked: boolean;



	aoeTurnEffects : Map<Number, Array<BattleEffect>> = new Map();

	playingAudio: HTMLAudioElement;
	secondaryAudio: HTMLAudioElement;
	backingAudio: HTMLAudioElement;
	faVolumeUp = faVolumeUp;
	volume: number = 0.5;


	imgPrefix : string = serverPrefix;
	showAreYouSure: boolean;

	// ======================================================================================================================
	// ------ LIFECYCLE -----------------------------------------------------------------------------------------------------
	// ======================================================================================================================

	constructor(
		loginStore : LoginStore,
		characterStore : CharacterStore,
		arenaStore : ArenaStore
	) {
		this.loginStore = loginStore;
		this.characterStore = characterStore;
		this.arenaStore = arenaStore;
	}

	ngOnInit() {

		this.characterStore.getCharacters().subscribe( x => {
			this.allCharacters = x;
		});
		this.arenaStore.disconnect();
		this.config = this.countdownConfigFactory();
		this.loginStore.getPlayer().subscribe( x => {
			this.player = x;
			this.arenaStore.setPlayer(this.player);
		});
		this.arenaStore.getOpponent().subscribe( x => {
			this.opponent = x;
		});

		this.arenaStore.getBattle().subscribe(x => {
			this.battle = x;
			if (x) {
				this.inBattle = true;
				this.countdown.restart();
			}
		})

		this.arenaStore.getBattleAllies().subscribe(x => {
			for (let c of this.battleAllies) {
				for (let d of x) {
					if (c.position == d.position) {
						if (!c.dead && d.dead) {
							this.playAudio("die");
						}
					}
				}
			}
			this.battleAllies = x;
		});
		this.arenaStore.getBattleEnemies().subscribe(x => {
			for (let c of this.battleEnemies) {
				for (let d of x) {
					if (c.position == d.position) {
						if (!c.dead && d.dead) {
							this.playAudio("die");
						}
					}
				}
			}
			this.battleEnemies = x;
		});
		this.arenaStore.getHasTurn().subscribe(x => {
			if (!this.hasTurn && x) {
				this.filterAbilities(x);
				this.filterEffects(this.battleAllies, this.battleEnemies);
				this.sendCostCheck();
				// opponent ended turn
			}
			if (this.hasTurn && !x){
				this.disableAbilities();
				this.cleanUpPhase();
				// i ended turn
			}
			this.hasTurn = x;
			this.countdown.restart();
		})
		this.arenaStore.getTurnEnergy().subscribe(x => {
			this.turnEnergy = x;
			this.sendCostCheck();
		})
		this.arenaStore.getSpentEnergy().subscribe(x => {
			this.spentEnergy = x;
		})
		this.arenaStore.getTurnEffects().subscribe(x => {
			this.turnEffects = x;
		})
		this.arenaStore.getAvailableAbilities().subscribe(x => {
			this.availableAbilities = x;
		})
		this.arenaStore.getAvailableTargets().subscribe(x => {
			this.availableTargets = x;
		})
		this.arenaStore.getChosenAbilities().subscribe(x => {
			this.chosenAbilities = x;
		})
		this.arenaStore.getChosenAbility().subscribe(x => {
			this.chosenAbility = x;
		})
		this.arenaStore.getActiveCharacterPosition().subscribe(x => {
			this.activeCharacterPosition = x;
		})

		this.arenaStore.getVictory().subscribe(x => {
			if (x) {
				this.playAudio("victory");
				alert("YOU HAVE WON");
			}
		})
		
		this.arenaStore.getDefeat().subscribe(x => {
			if (x) {
				this.playAudio("loss");
				alert("YOU HAVE LOST");
			}
		})

	}

	ngOnDestroy() {
		this.arenaStore.disconnect();
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
			this.arenaStore.setAllies(this.allies);
			this.arenaStore.connectToLadder(this.player);
			
			if (this.arenaStore.isConnected()) {

			}

			this.arenaStore.sendMatchMakingMessage();
		}
	}
	
	findQuickBattle() {
		if (this.allies.length !== 3) {
			alert ("You must select three characters");
		} else {
			this.arenaStore.setAllies(this.allies);
			this.arenaStore.connectToQuick(this.player);
		}
	}

	findPrivateBattle() {
		if (this.opponentName) {
			if (this.allies.length !== 3) {
				alert ("You must select three characters");
			} else {
				this.arenaStore.setAllies(this.allies);
				this.arenaStore.connectByPlayerName(this.player, this.opponentName);
			}
		} else {
			alert("You must enter an opponent's display name.")
		}
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

		this.arenaStore.setTurnEnergy(temp);
		this.arenaStore.setSpentEnergy(temp2);
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
	
				this.arenaStore.setTurnEnergy(temp);
				this.arenaStore.setSpentEnergy(temp2);
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

	getPortraits(value) {
		for(let c of this.allCharacters) {
			console.log(c);
			if (c.id === value) {
				return c.avatarUrl;
			}
		}
		return "";
	}


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
		  this.allyAbilities().forEach((x, y, z) => {
			  if (x.name === string) {
				return y + (this.isPlayerOne ? 0 : 3);
			  }
		  })
	  }

	clickAbility(ability) {

		if (this.abilityCurrentlyClicked) {
			
		} else if (this.isAbilityLocked(ability)) {
			alert("Can't use that now!")
		} else if(this.totalSpentEnergy > 0 && !this.abilitiesAreChosen()) {
			alert("Finish your energy trade or put your spent energy back before choosing abilities!")
		} else {
			this.arenaStore.setChosenAbility(ability)
			this.arenaStore.setActiveCharacterPosition(this.getCharacterPosition(ability.name));
			this.abilityCurrentlyClicked = true;
			this.sendTargetCheck();
		}
	}
	
	isAbilityLocked(ability) {
		return this.getAbilityCooldown(ability) < 0;
	}
	
	getAbilityCooldown(ability) : number  {
		let entry = <number> this.availableAbilities.get(ability.name);
		if (entry < 0){
			return -1 - entry;
		} else {
			return 0;
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

	disableAbilities() {
		this.availableAbilities = new Map();
	}


	getAbilityStyle(ability) {
		if (this.isAbilityLocked(ability)) {
			return {'opacity': 0.2};
		} else {
			return {'opacity': 1};
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

			this.arenaStore.confirmAbility(this.chosenAbility, tarArray, this.activeCharacterPosition, this.chosenAbilities);

			// add ability to UI
			this.addAbilityToReel(this.chosenAbility);
			this.clearSelection(false);
			this.sendCostCheck();
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

	clearSelection(force) {
		this.abilityCurrentlyClicked = false;
		this.activeCharacterPosition = -1;
		this.availableTargets = [];
		this.hideAbilityPanel(force);
	}

	clearAbilities() {
		if (this.totalSpentEnergy > 0) {
		  if (this.isPlayerOne) {
			this.arenaStore.setTurnEnergy(this.battle.playerOneEnergy);
		  } else {
			this.arenaStore.setTurnEnergy(this.battle.playerTwoEnergy);
		  }
		  this.arenaStore.setSpentEnergy(this.newMap());
		  this.refreshTradeState();
		}
		this.arenaStore.setChosenAbilities([]);
		// filter out dtos from turn effects

		this.arenaStore.setTurnEffects(
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
		this.arenaStore.setTurnEffects(this.turnEffects);
		this.arenaStore.setActiveCharacterPosition(-1);
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
			this.arenaStore.setChosenAbilities(this.chosenAbilities);
			this.arenaStore.setTurnEffects(this.turnEffects);
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

	sendCostCheck() {
		this.arenaStore.sendCostCheck(this.allyAbilities(), this.chosenAbilities);
	}

	sendTargetCheck(){
		let dto = new AbilityTargetDTO;
		dto.ability = this.chosenAbility;
		dto.characterPosition = this.activeCharacterPosition;
		dto.targetPositions = [];

		this.arenaStore.sendTargetCheck(dto);
	}

	sendEnergyTrade(energySpent : Map<String, Number>, energyGained : string){

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

		let spentEnergy : Map<string, Number> = this.spentEnergy;
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

		this.arenaStore.sendTurnEndMessage(spentEnergy, abilityDTOs, finalEffects);
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
		this.arenaStore.setSpentEnergy(this.newMap());
		this.arenaStore.setChosenAbilities([]);
		this.arenaStore.setTurnEffects([]);
		this.refreshTradeState();
		this.stopAudio();
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
		  allAbilities.push(ally.abilities);
		}
		return allAbilities;
	}
}
