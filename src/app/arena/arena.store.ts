import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Ability, AbilityTargetDTO, BattleEffect, BattleTurnDTO, Character, Player } from '../model/api-models';
import { ArenaService } from './arena.service';

@Injectable(
  {providedIn:'root'}
) 
export class ArenaStore {

    arenaService : ArenaService;

    arenaId : number;

    player : Player;
    allies : Array<Character>;

    isPlayerOne : boolean;
    _victory: BehaviorSubject<boolean> = new BehaviorSubject(false);
    victory: Observable<boolean> = this._victory.asObservable();

    setIsPlayerOne(isPlayerOne) {
      this.isPlayerOne = isPlayerOne;
    }

    getIsPlayerOne() {
      return this.isPlayerOne;
    }

    setArenaId(num : number) {
      this.arenaId = num;
    }

    constructor(arenaService : ArenaService) {
      this.arenaService = arenaService;
    }

    disconnect() {
      this.arenaService.disconnect();
    }

    connectToLadder(player) {
      console.log('::Looking For Ladder Match');
      this.arenaService.connectToLadder(player).subscribe(
        x => {
          this.setArenaId(<number> x);
        },
        y => {

        },
        () => {
          this.initSocket();
        },
      );
    }
  
    connectToQuick(player) {
      console.log('::Looking For Quick Match');
      this.arenaService.connectToQuick(player).subscribe(
        x => {
          this.setArenaId(<number> x);
        },
        y => {

        },
        () => {
          this.initSocket();
        },
      );
    }
  
    connectByPlayerName(player, name : string) {
      console.log('::Connecting to ' + name);
      this.arenaService.connectByPlayerName(player.id, name).subscribe(
        x => {
          this.setArenaId(<number> x);
        },
        y => {

        },
        () => {
          this.initSocket();
        },
      );
    }

    initSocket() {
      this.arenaService.connectByArenaId(this.arenaId);
      this.subscribeToSocket();
      this.sendMatchMakingMessage();
    }


    subscribeToSocket(){
      this.arenaService.socketMessage.subscribe(msg => {
        let mtp = msg.type;
      
        if (mtp === "INIT") {
          this.handleInitResponse(msg);
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
          console.log("Unrecognized Message, Type = " + mtp);
        }
      })
    }


    handleInitResponse(msg) {
      this.setIsPlayerOne(msg.battle.playerIdOne === this.player.id);
      let hasTurn;
      if (this.getIsPlayerOne()){
        this.setPlayer(msg.playerOne);
        this.setOpponent(msg.playerTwo);
        this.setBattle(msg.battle);

        let holder : Array<Character> = new Array();
        holder.push(msg.characters[3]);
        holder.push(msg.characters[4]);
        holder.push(msg.characters[5]);
        this.setEnemies(holder);

        this.setBattleAllies(msg.battle.playerOneTeam);
        this.setBattleEnemies(msg.battle.playerTwoTeam);

        this.setEnergy(msg.battle.playerOneEnergy);
        this.setSpent(this.newMap());
      
      } else {
        this.setPlayer(msg.playerTwo);
        this.setOpponent(msg.playerOne);
        this.setBattle(msg.battle);

        let holder : Array<Character> = new Array();
        holder.push(msg.characters[0]);
        holder.push(msg.characters[1]);
        holder.push(msg.characters[2]);
        this.setEnemies(holder);

        this.setBattleAllies(msg.battle.playerTwoTeam);
        this.setBattleEnemies(msg.battle.playerOneTeam);

        this.setEnergy(msg.battle.playerOneEnergy);
        this.setSpent(this.newMap());
        
      }

      this.setTempAllies(Object.create(this.allies));

      if ( (msg.battle.playerOneStart && this.getIsPlayerOne()) || (!msg.battle.playerOneStart && !this.getIsPlayerOne()) ) {
        this.setHasTurn(true);
        // component subscription
        this.sendCostCheck();
      } else {
        this.setHasTurn(false);
        // component subscription
        this.disableAbilities();
      }
    }


    handleEnergyTradeResponse(msg) {
      this.setBattle(msg.battle);
      if (this.getIsPlayerOne()) {
        this.setEnergy(msg.battle.playerOneEnergy);
      } else {
        this.setEnergy(msg.battle.playerTwoEnergy);
      }
      
      this.setSpent(this.newMap());
      this.setEnergyTrade(null);
      // do another cost check 
      // this should be in a subscription to energy in the component
      this.sendCostCheck();
    }
    
    handleCostCheckResponse(msg) {
      this.setAvailableAbilities(msg.usable);
    }

    handleTargetCheckResponse(msg) {
      this.setAvailableTargets(msg.dto.targetPositions);
    }
    

    handleSurrenderResponse(msg) {
      // TODO: set victory above so it cascades down to component
      if (this.player.id === msg.playerId) {
        this._victory.next(false);
      } else {
        this._victory.next(true);
      }

      // SUBCSCRIBE TO VICTORY OSERVABLE
      this.endBattle();
      
      if(victory) {
        this.playAudio("victory");
        alert("YOU HAVE WON");
      } else {
        this.playAudio("loss");
        alert("YOU HAVE LOST");
      }
    }
    

    handleTurnEndResponse(msg) {

      this.setBattle(msg.battle);

      let team;
      let enemyTeam;

      if (this.getIsPlayerOne()) {
        team = msg.battle.playerOneTeam;
        enemyTeam = msg.battle.playerTwoTeam;
        this.setBattleAllies(team);
        this.setBattleEnemies(enemyTeam);
        this.setEnergy(msg.battle.playerOneEnergy);
      } else {
        team = msg.battle.playerTwoTeam;
        enemyTeam = msg.battle.playerOneTeam;
        this.setBattleAllies(team);
        this.setBattleEnemies(enemyTeam);
        this.setEnergy(msg.battle.playerTwoEnergy);
      }

      let victory = enemyTeam[0].dead && enemyTeam[1].dead && enemyTeam[2].dead;
      let defeat = team[0].dead && team[1].dead && team[2].dead;

      if (victory) {
        this._victory.next(true);
      }

      if (defeat) {
        this._defeat.next(true);
      }

      if (msg.playerId === this.player.id) {
        console.log("You ended your turn");
        this.cleanUpPhase();
        this.setHasTurn(false);
        // move this to component in the subscription
        this.disableAbilities();
      } else {
        console.log("They ended their turn");
        this.setHasTurn(true);
        // move this to component in the subscription
        this.filterAbilities(team);
        this.checkForAoes(team, enemyTeam);
        this.sendCostCheck();
      }

      this.getCountdown().restart();

      
      // move this logic to subscription in component 

      // for (let ch of this.getBattle().playerOneTeam) {
      //   for (let chNew of msg.battle.playerOneTeam) {
      //     if (ch.position == chNew.position) {
      //       if (!ch.dead && chNew.dead) {
      //         this.playAudio("die");
      //       }
      //     }
      //   }
      // }

      // for (let ch of this.getBattle().playerTwoTeam) {
      //   for (let chNew of msg.battle.playerTwoTeam) {
      //     if (ch.position == chNew.position) {
      //       if (!ch.dead && chNew.dead) {
      //         this.playAudio("die");
      //       }
      //     }
      //   }
      // }

      // subscribe to this in component 

      // if(defeat) {
      //   this.playAudio("loss");
      //   this.endBattle();
      //   alert("YOU HAVE LOST");
      // }
      // if(victory) {
      //   this.playAudio("victory");
      //   this.endBattle();
      //   alert("YOU HAVE WON");
      // }
    }

    // maybe these live in the component and facade back through the store?  makes the most sense.


    sendMatchMakingMessage() {
      let msg = {
        type: "MATCH_MAKING",
        char1: this.allies[0].id,
        char2: this.allies[1].id,
        char3: this.allies[2].id,
        playerId: this.player.id,
        arenaId: this.arenaId
      };
      this.arenaService.sendWebsocketMessage(JSON.stringify(msg));
    }

    sendCostCheck(allyAbilities, chosenAbilities) {
      let costCheckDTO = {
        allyAbilities : allyAbilities,
        chosenAbilities : chosenAbilities
      }
      
      const payload = {
        type: "COST_CHECK",
        playerId: this.player.id,
        costCheckDTO: costCheckDTO
      };

      this.arenaService.sendWebsocketMessage(JSON.stringify(payload));
    }

    sendTargetCheck(dto : AbilityTargetDTO){
      this.arenaService.sendWebsocketMessage(
        JSON.stringify({
          type: "TARGET_CHECK",
          playerId: this.player.id,
          abilityTargetDTO: dto
        })
      )
    }

    sendEnergyTrade(energySpent : Map<String, Number>, energyGained : string){
      this.arenaService.sendWebsocketMessage(
        JSON.stringify({
          type: "ENERGY_TRADE",
          playerId: this.player.id,
          spent: energySpent,
          chosen: energyGained
        })
      )
    }

    surrender() {
      // just manually kill my team and send turn end
      this.arenaService.sendWebsocketMessage(
        JSON.stringify({
          type: "SURRENDER",
          playerId: this.player.id
        })
      )
    }
      
    sendTurnEndMessage(spentEnergy, abilityDTOs, finalEffects) {

      let battleTurnDTO : BattleTurnDTO = {
        spentEnergy : spentEnergy,
        abilities : abilityDTOs,
        effects : finalEffects
      }
  
      const payload = {
        type: "TURN_END",
        playerId: this.player.id,
        battleTurnDTO: battleTurnDTO
      }

      this.arenaService.sendWebsocketMessage(
        JSON.stringify(payload)
      );
    }

    /// ABILITIES ///


    confirmAbility(chosenAbility, tarArray, activeCharacterPosition, chosenAbilities) {

      // form and add AbiltyTargetDTOS to array
			let dto = new AbilityTargetDTO;
			dto.ability = chosenAbility;
			dto.targetPositions = tarArray;
			dto.characterPosition = activeCharacterPosition;

      // add DTO for backend call, gets sent at the end!!! (got it)
      chosenAbilities.push(dto);
      this.setChosenAbilities(chosenAbilities);
    }



    //// ENERGY ////

    setTurnEnergy(energyMap) {
      this.turnEnergy = energyMap;
    }
  
    setSpentEnergy(energyMap) {
      this.spentEnergy = energyMap;
    }


  // UTIL //////

    
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
		this.showAreYouSure = false;
		this.setSpent(this.newMap());
		this.refreshTradeState();
		this.stopAudio();
	}

}
