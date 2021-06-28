import { AfterViewInit, Component, OnDestroy, OnInit, } from '@angular/core';
import { Battle, Character, Player, Portrait } from 'src/app/model/api-models';
import { ArenaStore } from '../../utils/arena.store';
import { CharacterStore } from '../../utils/character.store';
import { LoginStore } from '../../utils/login.store';
import { take, takeUntil } from 'rxjs/operators'
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';

@Component({
  selector: 'battle-root',
  templateUrl: './battle.component.html',
  styleUrls: ['./battle.component.css']
})
export class BattleComponent implements OnInit, AfterViewInit, OnDestroy {

  allCharacters$ : Observable<Array<Character>>;
  allCharacters : Array<Character>;

  characterPortraits : Map<number, Portrait> = new Map();

  myCharacters : Array<Character> = [];

  inBattle : boolean;

  player$ : Observable<Player>;
  player : Player;

  arenaId : number;

  allies : Array<Character> = [];
  
  opponentName : string;

  lookingForBattle : boolean;

  arenaStore : ArenaStore;
  loginStore : LoginStore;
  characterStore : CharacterStore;
  
  battleSub : Subscription;
	playerSub: Subscription;
	allCharactersSub: Subscription;
	destroy$: Subject<boolean> = new Subject();

	constructor(
    arenaStore : ArenaStore,
    loginStore : LoginStore,
    characterStore : CharacterStore
	) {
    this.arenaStore = arenaStore;
    this.loginStore = loginStore;
    this.characterStore = characterStore;
  }

  ngAfterViewInit() {
  }
  
  ngOnInit() {
	this.initSubscriptions();
	this.initBattleSub();
  }

  initSubscriptions() {
    this.loginStore.getPlayer()
	.pipe(takeUntil(this.destroy$))
	.subscribe(x => {
      this.player = x;
    });

    this.characterStore.getCharacters()
	.pipe(takeUntil(this.destroy$))
	.subscribe(x => {
      this.allCharacters = x;
        for(let c of x) {
          let portrait : Portrait = {
            style : {opacity : 1.0},
            url : c.avatarUrl
          }
          this.characterPortraits.set(c.id, portrait);
            if (this.player.characterIdsUnlocked.includes(c.id)) {
              this.myCharacters.push(c);
            }
        }
    });
  }

	initBattleSub() {
		this.arenaStore.getInBattle()
		.pipe(takeUntil(this.destroy$))
		.subscribe( x => {
			if (x) {
				this.lookingForBattle = false;
				this.inBattle = x;
			}
		});
	}

	ngOnDestroy() {
		this.destroy$.next(true);
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
			this.lookingForBattle = true;
			this.arenaStore.connectToLadder(this.player, this.allies);
		
		}
	}
	
	findQuickBattle() {
		if (this.allies.length !== 3) {
			alert ("You must select three characters");
		} else {
			this.lookingForBattle = true;
			this.arenaStore.connectToQuick(this.player, this.allies);
		}
	}

	findPrivateBattle() {
		if (this.opponentName) {
			if (this.allies.length !== 3) {
				alert ("You must select three characters");
			} else {
				this.lookingForBattle = true;
				this.arenaStore.connectByPlayerName(this.player, this.opponentName, this.allies);
			}
		} else {
			alert("You must enter an opponent's display name.")
		}
	}



}
