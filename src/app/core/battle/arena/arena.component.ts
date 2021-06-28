import {  AfterViewInit, Component, HostListener, Input, OnDestroy, OnInit } from '@angular/core';
import { Battle, Character, Player, CharacterInstance, AbilityTargetDTO, Ability, Effect, BattleEffect, Portrait, PlayerEnergy} from 'src/app/model/api-models';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import { faVolumeUp } from '@fortawesome/free-solid-svg-icons';
import { ArenaStore } from 'src/app/utils/arena.store';
import { LoginStore } from 'src/app/utils/login.store';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

import { interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators'
import { ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'arena-root',
  templateUrl: './arena.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./arena.component.css']
})
export class ArenaComponent implements OnInit, AfterViewInit, OnDestroy {

	// ======================================================================================================================
	// ------ PROPERTIES ----------------------------------------------------------------------------------------------------
	// ======================================================================================================================

	router : Router;

	loginStore : LoginStore;
	arenaStore : ArenaStore;
	

	battle : Battle;

	@Input()
	player : Player;
	opponent : Player;

	hasTurn : boolean = false;
	isPlayerOne : boolean = false;

	@Input()
	allies : Array<Character> = [];
	tempAllies : Array<Character> = [];

	battleAllies : Array<CharacterInstance> = [];
	battleEnemies : Array<CharacterInstance> = [];

    _playerEnergy: BehaviorSubject<Array<PlayerEnergy>> = new BehaviorSubject([]);
	playerEnergy: Observable<Array<PlayerEnergy>> = this._playerEnergy.asObservable();
	
	turnEnergy: Array<string> = [];
	spentEnergy: Array<string> = [];


	strC = 0;
	dexC = 0;
	arcC = 0;
	divC = 0;
	
	strS = 0;
	dexS = 0;
	arcS = 0;
	divS = 0;

	randomCap = 0;
	lockedStr = 0;
	lockedDex = 0;
	lockedArc = 0;
	lockedDiv = 0;

	totalEnergy : number = 0;
	totalSpentEnergy : number = 0;

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
	showAreYouSure: boolean;

	gameOver$: Subject<boolean> = new Subject();
	victory: boolean = false;

	// ======================================================================================================================
	// ------ LIFECYCLE -----------------------------------------------------------------------------------------------------
	// ======================================================================================================================

	constructor(
		arenaStore : ArenaStore,
		loginStore : LoginStore,
		router : Router
	) {
		this.arenaStore = arenaStore;
		this.loginStore = loginStore;
		this.router = router;
	}

	ngAfterViewInit() {
		// this.initSubscriptions();
	}

	ngOnInit() {
	
		this.gameOver$.next(false);
		this.initSubscriptions();
	}

	ngOnDestroy() {
		console.log("WE DESTROYED THIS SHIT");
		
		if (!this.victory) {
			this.surrender();
		}
	}

	@HostListener('window:beforeunload', ['$event'])
	unloadHandler(event: Event) {
		this.surrender();
	}

	initSubscriptions() {
		this.arenaStore.
		getOpponent()
		.pipe(takeUntil(this.gameOver$))
		.subscribe( x => {
			if (x) {
				this.opponent = x;
			}
		})

		this.subscribeToBattle();
		
		this.arenaStore.getAvailableAbilities()
		.pipe(takeUntil(this.gameOver$))
		.subscribe(x => {
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

		this.arenaStore.getAvailableTargets()
		.pipe(takeUntil(this.gameOver$))
		.subscribe(x => {
			if (x) {
				if (x.length > 0) {
					console.log("got new available targets" + x);
					this.availableTargets = x;
					this.updateCharacterStyles();
				}
			}
		})
	}

	subToVictory() {
		this.arenaStore.getVictory()
		.pipe(takeUntil(this.gameOver$))
		.subscribe(x => {
			if (x !== null) {
				if (x.victory) {
					this.playAudio("victory");
					this.loginStore.setPlayer(x.player);
				} else {
					this.playAudio("loss");
				}
				alert(x.progressString);
				this.unsubToBattle();
			}
		})
	}

	unsubToBattle() {
		this.gameOver$.next(true);
		this.victory = true;
		this.router.navigate(['/']);
	}

	subscribeToBattle() {		
		this.arenaStore.getBattle()
		.pipe(takeUntil(this.gameOver$))
		.subscribe(x => {
			if (x) {

				console.log(x);
				this.battle = x;

				this._timeLeft.next(60);
				if (this.battle.turn === 0) {
					this.startTimer();
					this.initEnergy();
					this.subToVictory();
					this.tempAllies = Object.create(this.allies);
					this.isPlayerOne = this.player.id === this.battle.playerIdOne;
				}

				let iStarted : boolean = 
					(this.isPlayerOne && this.battle.playerOneStart) ||
					(!this.isPlayerOne && !this.battle.playerOneStart);

				this.hasTurn = 
					((this.battle.turn % 2 === 0) && iStarted) ||
					((this.battle.turn % 2 !== 0) && !iStarted);

				let playerString = this.isPlayerOne ? "I'm Player One, and " : "I'm Player Two, and ";
				console.log(playerString + "I just " + (this.hasTurn ? "began" : "ended") +" my turn.");
				let team = this.isPlayerOne ? this.battle.playerOneTeam : this.battle.playerTwoTeam;
				let enemies = this.isPlayerOne ? this.battle.playerTwoTeam : this.battle.playerOneTeam;

				if (this.isPlayerOne) {
					this.setPlayerEnergy(this.serverEnergyToPlayerEnergy(this.battle.playerOneEnergy));
				} else {
					this.setPlayerEnergy(this.serverEnergyToPlayerEnergy(this.battle.playerTwoEnergy));
				}
				
				this.sendCostCheck();

				if (this.battle.turn === 0) {
					for(let c of team) {
						let portrait : Portrait = this.characterPortraits.get(c.characterId);
						let battlePortrait : Portrait = Object.assign(portrait);

						let playerOneChar : boolean  = c.position > 2 ? false : true;

						let suffix : string = playerOneChar ? "o" : "t";
						let id : number = c.characterId;
						let indx : string = id + suffix;

						this.battlePortraits.set(indx, battlePortrait);
					}
					for(let c of enemies) {
						let portrait : Portrait = this.characterPortraits.get(c.characterId);
						let battlePortrait : Portrait = Object.assign(portrait);

						let playerOneChar : boolean  = c.position > 2 ? false : true;
						
						let suffix : string = playerOneChar ? "o" : "t";
						let id : number = c.characterId;
						let indx : string = id + suffix;

						this.battlePortraits.set(indx, battlePortrait);
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
				this.filterAbilities(this.battleAllies);
				
				if (!this.hasTurn) {
					this.cleanUpPhase();
				}
			}
		})
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
			this.playingAudio.src = "/assets/sounds/" + sound + ".wav";
			this.playingAudio.volume = this.volume;
			
			this.playingAudio.load();
			this.playingAudio.play();
		} else {
			if (this.secondaryAudio){
				if (this.secondaryAudio.ended) {
					this.stopSecondary();
				}
			}
			if (!this.secondaryAudio) {
				this.secondaryAudio = new Audio();
				this.secondaryAudio.src = "/assets/sounds/" + sound + ".wav";
				this.secondaryAudio.volume = this.volume;

				this.secondaryAudio.load();
				this.secondaryAudio.play();
			} else {
				this.stopBoth();
				this.playAudio(sound);
			}
		}
	}

	stopBoth() {
		this.stopAudio;
		this.stopSecondary;
	}

	stopAudio() {
		if (this.playingAudio) {
			this.playingAudio.pause();
			this.playingAudio = null;
		}
	}

	stopSecondary() {
		if (this.secondaryAudio) {
			this.secondaryAudio.pause();
			this.secondaryAudio = null;
		}
	}

	// ======================================================================================================================
	// ------ TIMER --------------------------------------------------------------------------------------------------------
	// ======================================================================================================================

	_timeLeft: BehaviorSubject<number> = new BehaviorSubject(60);
	timeLeft: Observable<number> = this._timeLeft.asObservable();

	clock : Observable<number> = interval(1000);


	getClock(): Observable<number> {
		return this.clock;
	}

	// restartClock() {
	// 	this.restart$.next(true);
	// }

	startTimer() {
		this.getClock()
		.pipe(takeUntil(this.gameOver$))
		.subscribe(
			i => {
				let val = this._timeLeft.getValue();
				if (val === 60) {
					this.onStart();
				} else if (val === 8 && this.hasTurn) {
					this.playAudio("timerlow");
					// play warning sound
				} else if (val === 0) {
					this.onStop();
				}
				
				let newTime = val - 1;
				this._timeLeft.next(newTime);
			}, y => {

			}, () => {
			}
		);
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

	initEnergy() {
	this.playerEnergy	
		.pipe(takeUntil(this.gameOver$))
		.subscribe( x => {
			console.log("Player Energy: ");
			console.log(x);
			x.sort((a, b) => {
				let order = ["DIVINITY", "ARCANA", "DEXTERITY", "STRENGTH"];
				// div arc dex str
				let aIndex = order.findIndex((value) => {
					value === a.type;
				});
				let bIndex = order.findIndex((value) => {
					value === b.type;
				});
				return aIndex - bIndex;
			})

			this.turnEnergy = [];
			this.spentEnergy = [];
			this.totalEnergy = 0;
			this.totalSpentEnergy = 0;
			this.strC = 0;
			this.strS = 0;
			this.dexC = 0;
			this.dexS = 0;
			this.arcC = 0;
			this.arcS = 0;
			this.divC = 0;
			this.divS = 0;

			for (let playerEnergy of x) {
				let str = playerEnergy.type;
				for (let amount = playerEnergy.amount; amount > 0 ; amount--) {
					this.totalEnergy++;
					if (str === "STRENGTH") {
						this.strC++;
					}
					if (str === "DEXTERITY") {
						this.dexC++;
					}
					if (str === "ARCANA") {
						this.arcC++;
					}
					if (str === "DIVINITY") {
						this.divC++;
					}
					this.turnEnergy.push(str);
				}
				for (let spent = playerEnergy.spent; spent > 0 ; spent--) {
					this.totalSpentEnergy++;
					if (str === "STRENGTH") {
						this.strS++;
					}
					if (str === "DEXTERITY") {
						this.dexS++;
					}
					if (str === "ARCANA") {
						this.arcS++;
					}
					if (str === "DIVINITY") {
						this.divS++;
					}
					this.spentEnergy.push(str);
				}
			}
		})
	}

	serverEnergyToPlayerEnergy(a : any) : Array<PlayerEnergy> {
		let str = a["STRENGTH"];
		let dex = a["DEXTERITY"];
		let arc = a["ARCANA"];
		let div = a["DIVINITY"];
		let arrayP = [];
		let pe1 = new PlayerEnergy();
		let pe2 = new PlayerEnergy();
		let pe3 = new PlayerEnergy();
		let pe4 = new PlayerEnergy();

		pe1.type = "DIVINITY";
		pe1.amount = div;
		pe1.spent = 0;
		pe1.total = pe1.amount + pe1.spent;
		
		pe2.type = "ARCANA";
		pe2.amount = arc;
		pe2.spent = 0;
		pe2.total = pe2.amount + pe2.spent;
		
		pe3.type = "DEXTERITY";
		pe3.amount = dex;
		pe3.spent = 0;
		pe3.total = pe3.amount + pe3.spent;
		
		pe4.type = "STRENGTH";
		pe4.amount = str;
		pe4.spent = 0;
		pe4.total = pe4.amount + pe4.spent;

		arrayP.push(pe1);
		arrayP.push(pe2);
		arrayP.push(pe3);
		arrayP.push(pe4);

		return arrayP;
	}

	getSpentEnergy() : Array<string> {
		return this.spentEnergy;
	}

	getTurnEnergy() : Array<string> {
		return this.turnEnergy;
	}

	spendEnergy(energy : string, force : boolean) {
		console.log("CLICKED");
		console.log(energy);
		console.log("BEFORE");
		console.log(this.turnEnergy);
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
				this.spend(energy, false);
			} else {
				this.spend(energy, false);
			} 
		}
		console.log("AFTER");
		console.log(this.turnEnergy);
		if (!force) {
			this.sendCostCheck();
		}
	}

	spend(energy: string, refund: boolean) {
		// build new playerEnergy properly, and emit it

		let countC = 0;
		let countS = 0;

		if (energy === "STRENGTH") {
			countC = this.strC;
			countS = this.strS;
		} else if (energy === "DEXTERITY") {
			countC = this.dexC;
			countS = this.dexS;
		} else if (energy === "ARCANA") {
			countC = this.arcC;
			countS = this.arcS;
		} else if (energy === "DIVINITY") {
			countC = this.divC;
			countS = this.divS;
		}


		let allPlayerEnergy = [];
		let playerEnergy = new PlayerEnergy();
		playerEnergy.type = energy;
		if (refund) {
			playerEnergy.amount = countC + 1;
			playerEnergy.spent = countS - 1;
		} else {
			playerEnergy.amount = countC - 1;
			playerEnergy.spent = countS + 1;
		}
		playerEnergy.total = playerEnergy.amount + playerEnergy.spent;
		allPlayerEnergy.push(playerEnergy);

		if (energy !== "STRENGTH") {
			let playerEnergy = new PlayerEnergy();
			playerEnergy.type = "STRENGTH";
			playerEnergy.amount = this.strC;
			playerEnergy.spent = this.strS;
			playerEnergy.total = playerEnergy.amount + playerEnergy.spent;
			allPlayerEnergy.push(playerEnergy);
		}
		if (energy !== "DEXTERITY") {
			let playerEnergy = new PlayerEnergy();
			playerEnergy.type = "DEXTERITY";
			playerEnergy.amount = this.dexC;
			playerEnergy.spent = this.dexS;
			playerEnergy.total = playerEnergy.amount + playerEnergy.spent;
			allPlayerEnergy.push(playerEnergy);
		}
		if (energy !== "ARCANA") {
			let playerEnergy = new PlayerEnergy();
			playerEnergy.type = "ARCANA";
			playerEnergy.amount = this.arcC;
			playerEnergy.spent = this.arcS;
			playerEnergy.total = playerEnergy.amount + playerEnergy.spent;
			allPlayerEnergy.push(playerEnergy);
		}
		if (energy !== "DIVINITY") {
			let playerEnergy = new PlayerEnergy();
			playerEnergy.type = "DIVINITY";
			playerEnergy.amount = this.divC;
			playerEnergy.spent = this.divS;
			playerEnergy.total = playerEnergy.amount + playerEnergy.spent;
			allPlayerEnergy.push(playerEnergy);
		}

		this.setPlayerEnergy(allPlayerEnergy);
	}

	// only for refunding abilities I guess
	returnEnergy(energy : string, force : boolean) {
		
		if(energy === "RANDOM") {
			// shouldn't happen
		} else {

			if (!force) {
				this.calculateLockedEnergy();
			}

			if (energy === "STRENGTH" && this.strS === this.lockedStr && !force) {
				alert("You can't remove that energy, remove the ability you spent it on first!");
			} else if (energy === "DEXTERITY" && this.dexS === this.lockedDex && !force) {
				alert("You can't remove that energy, remove the ability you spent it on first!");
			} else if (energy === "ARCANA" && this.arcS === this.lockedArc && !force) {
				alert("You can't remove that energy, remove the ability you spent it on first!");
			} else if (energy === "DIVINITY" && this.divS === this.lockedDiv && !force) {
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
				
				// refund
				this.spend(energy, true);
			}
		}
		if (!force) {
			this.sendCostCheck();
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
		if (this.strS > this.lockedStr) {
			this.returnEnergy("STRENGTH", true);
		} else if (this.dexS > this.lockedDex) {
			this.returnEnergy("DEXTERITY", true);
		} else if (this.arcS > this.lockedArc) {
			this.returnEnergy("ARCANA", true);
		} else if (this.divS > this.lockedDiv) {
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
		this.sendCostCheck();
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
					this.sendCostCheck();
				}

				if (this.randomsNeeded === 0) {
					this.randomsAreNeeded = false;
				}
			}
		}
		this.sendCostCheck();
	}

	clickEnergyTrade() {
		if (!this.energyTrade) {
			alert("Pick an energy to trade for.");
		} else if (this.totalSpentEnergy !== 5) {
			alert("You must spend 5 energy, to trade for 1");
		} else {
			// calculate or call current spent energy
			this.sendEnergyTrade(this.getSpentEnergy(), this.energyTrade);
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
		// gotta populate a map of <instanceID, effect> so we dont show AOE more than once on turnEffects
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
					if (effect) {
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

	updateCharacterStyle(c : CharacterInstance) {
		let playerOneChar : boolean  = c.position > 2 ? false : true;
		let suffix : string = playerOneChar ? "o" : "t";
		let id : number = c.characterId;
		let indx : string = id + suffix;
		let style =  this.getCharacterStyle(c.position);
		let portrait = this.battlePortraits.get(indx);
		portrait.style = style; 
		this.battlePortraits.set(indx, portrait);
	}

	getCharacterPortrait(c : CharacterInstance): string {
		let playerOneChar : boolean  = c.position > 2 ? false : true;
		let suffix : string = playerOneChar ? "o" : "t";
		let id : number = c.characterId;
		let indx : string = id + suffix;
		return this.battlePortraits.get(indx).url;
	}

	getCharacterStyle(characterPosition) {
		if (this.isTargetLocationLocked(characterPosition)) {
			return {'opacity': 0.2};
		} else {
			return {'opacity': 1};
		}
	}

	getAbilityStyle(ability) {
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
			return false;
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
			this.availableTargets = [-1,-1,-1,-1,-1,-1];
			this.setChosenAbility(ability);
			this.setActiveCharacterPosition(this.getCharacterPosition(ability.name));
			console.log("Active Character Position = " + this.activeCharacterPosition);
			this.abilityCurrentlyClicked = true;
			this.sendTargetCheck();
		}
	}


	clickTarget(targetLocation) {
		if (this.isTargetLocationLocked(targetLocation)) {
			alert("That character can't be targeted with this ability!");
		} else if (this.chosenAbility) {

			this.availableAbilities = new Map();
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

			this.confirmAbility(this.chosenAbility, tarArray);
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

    confirmAbility(chosenAbility, tarArray) {

		// form and add AbiltyTargetDTOS to array
		let dto = new AbilityTargetDTO;
		dto.ability = chosenAbility;
		dto.targetPositions = tarArray;
		dto.characterPosition = this.activeCharacterPosition - (this.isPlayerOne ? 0 : 3);
  
		// add DTO for backend call, gets sent at the end!!! (got it)
		this.chosenAbilities.push(dto);
		// add ability to UI
		this.addAbilityToReel(chosenAbility);
		this.clearSelection(false);
	  }

	clearSelection(force) {
		this.abilityCurrentlyClicked = false;
		this.setActiveCharacterPosition(-1);
		this.arenaStore.setAvailableTargets([0, 1, 2, 3, 4, 5]);
		this.hideAbilityPanel(force);
	}

	clearAbilities() {
		if (this.totalSpentEnergy > 0) {
		  if (this.isPlayerOne) {
			this.setPlayerEnergy(this.serverEnergyToPlayerEnergy(this.battle.playerOneEnergy));
		  } else {
			this.setPlayerEnergy(this.serverEnergyToPlayerEnergy(this.battle.playerTwoEnergy));
		  }
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

	  isReelNotEmpty() {
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
	}

	removeAbilityFromReel(effect : BattleEffect) {
		if (effect.instanceId > 0) {
			// can't remove pre-existing conditions breh
			// TODO: add check here to remove or reorder some of these hanging or dead effects
		} else {
			var index = this.chosenAbilities.findIndex(a => a.ability.name==effect.name);
			let ability = this.chosenAbilities[index].ability;
			var index2 = this.turnEffects.findIndex(e => (e.instanceId < 0 && e.name === effect.name));
	
			this.chosenAbilities.splice(index, 1);
			this.turnEffects.splice(index2, 1);
			this.refundCostTemporary(ability);
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
		
		if (this.hasTurn) {
			let allyAbilityCosts = [];
			for (let ability of this.allyAbilities()) {
				allyAbilityCosts.push(ability.cost);
			}
			this.arenaStore.sendCostCheck(allyAbilityCosts, this.chosenAbilities, this.spentEnergy);
		}
	}

	sendTargetCheck(){
		let dto : AbilityTargetDTO = {
			ability : this.chosenAbility,
			characterPosition : this.activeCharacterPosition,
			targetPositions : []
		}

		this.arenaStore.sendTargetCheck(dto);
	}

	sendEnergyTrade(energySpent : Array<string>, energyGained : string){
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

		// determine spent energy for this below
		let spentEnergy = new Map();
		spentEnergy.set("STRENGTH", this.strS);
		spentEnergy.set("DEXTERITY", this.dexS);
		spentEnergy.set("ARCANA", this.arcS);
		spentEnergy.set("DIVINITY", this.divS);
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
		this.setChosenAbilities([]);
		this.setTurnEffects([]);
		this.randomsNeeded = 0;
		this.randomsAreNeeded = false;
		this.showAreYouSure = false;
		this.refreshTradeState();
		this.stopAudio();
		this.disableAbilities();
	}

	// cleanTurnEnergy() {
	// 	this.turnDivinity = [];
	// 	this.turnArcana = [];
	// 	this.turnDexterity = [];
	// 	this.turnStrength = [];
	// }

	// cleanSpentEnergy() {
	// 	this.spentDivinity = [];
	// 	this.spentArcana = [];
	// 	this.spentDexterity = [];
	// 	this.spentStrength = [];
	// }

	// cleanEnergy() {
	// 	this.cleanTurnEnergy();
	// 	this.cleanSpentEnergy();
	// }


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
    setPlayerEnergy(next) {
		console.log("SETTING PLAYER ENERGY");
		console.log(next);
      this._playerEnergy.next(next);
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
