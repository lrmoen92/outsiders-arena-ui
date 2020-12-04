import { Component, OnDestroy, OnInit, } from '@angular/core';
import { Battle, Character, Player, Portrait } from 'src/app/model/api-models';
import { ArenaStore } from '../../utils/arena.store';
import { CharacterStore } from '../../utils/character.store';
import { serverPrefix } from '../../utils/constants';
import { LoginStore } from '../../utils/login.store';
import { take } from 'rxjs/operators'
import { Observable } from 'rxjs';

@Component({
  selector: 'battle-root',
  templateUrl: './battle.component.html',
  styleUrls: ['./battle.component.css']
})
export class BattleComponent implements OnInit, OnDestroy {

  allCharacters$ : Observable<Array<Character>>;
  allCharacters : Array<Character>;

  characterPortraits : Map<number, Portrait> = new Map();

  myCharacters : Array<Character> = [];

  inBattle : boolean;

  player$ : Observable<Player>;
  player : Player;

  arenaId : number;

  imgPrefix : string = serverPrefix;

  allies : Array<Character> = [];
  
  opponentName : string;

  arenaStore : ArenaStore;
  loginStore : LoginStore;
  characterStore : CharacterStore;

	constructor(
    arenaStore : ArenaStore,
    loginStore : LoginStore,
    characterStore : CharacterStore
	) {
    this.arenaStore = arenaStore;
    this.loginStore = loginStore;
    this.characterStore = characterStore;
  }
  
  ngOnInit() {
		this.allCharacters$ = this.characterStore.getCharacters();
    this.player$ = this.loginStore.getPlayer();

    this.player$.subscribe(x => {
      this.player = x;
    });

    this.allCharacters$.subscribe(x => {
      this.allCharacters = x;
        for(let c of x) {
          let portrait : Portrait = {
            style : {opacity : 1.0},
            url : this.imgPrefix + c.avatarUrl
          }
          this.characterPortraits.set(c.id, portrait);
            if (this.player.characterIdsUnlocked.includes(c.id)) {
              this.myCharacters.push(c);
            }
        }
    });

    this.arenaStore.getInBattle().subscribe( x => {
      if (x) {
        this.inBattle = x;
      }
    });
  }

  

	ngOnDestroy() {
		// this.arenaStore.disconnect();
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



}
