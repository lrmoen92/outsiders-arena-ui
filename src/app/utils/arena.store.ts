import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Ability, AbilityTargetDTO, Battle, BattleEffect, BattleTurnDTO, Character, CharacterInstance, CostCheckDTO, Player } from '../model/api-models';
import { ArenaService } from './arena.service';

@Injectable(
  {providedIn:'root'}
) 
export class ArenaStore {

    arenaService : ArenaService;

    arenaId : number;

    _player : BehaviorSubject<Player> = new BehaviorSubject(null);
    player : Observable<Player> = this._player.asObservable();
    playerSub : Player;
    
    allies : Array<Character>;

    isPlayerOne : boolean;
    _isPlayerOne: BehaviorSubject<boolean> = new BehaviorSubject(null);

    _inBattle: BehaviorSubject<boolean> = new BehaviorSubject(null);
    inBattle: Observable<boolean> = this._inBattle.asObservable();

    _hasTurn: BehaviorSubject<boolean> = new BehaviorSubject(null);
    hasTurn: Observable<boolean> = this._hasTurn.asObservable();

    _gameEnd: BehaviorSubject<boolean> = new BehaviorSubject(false);
    gameEnd: Observable<boolean> = this._gameEnd.asObservable();
    
    _opponent: BehaviorSubject<Player> = new BehaviorSubject(null);
    opponent: Observable<Player> = this._opponent.asObservable();
    
    _battle: BehaviorSubject<Battle> = new BehaviorSubject(null);
    battle: Observable<Battle> = this._battle.asObservable();
    
    _tempAllies: BehaviorSubject<Array<Character>> = new BehaviorSubject([]);
    tempAllies: Observable<Array<Character>> = this._tempAllies.asObservable();
    
    _enemies: BehaviorSubject<Array<Character>> = new BehaviorSubject([]);
    enemies: Observable<Array<Character>> = this._enemies.asObservable();
    
    // _battleAllies: BehaviorSubject<Array<CharacterInstance>> = new BehaviorSubject([]);
    // battleAllies: Observable<Array<CharacterInstance>> = this._battleAllies.asObservable();
    
    // _battleEnemies: BehaviorSubject<Array<CharacterInstance>> = new BehaviorSubject([]);
    // battleEnemies: Observable<Array<CharacterInstance>> = this._battleEnemies.asObservable();
    
    // _turnEnergy: BehaviorSubject<Map<string, number>> = new BehaviorSubject(this.newMap());
    // turnEnergy: Observable<Map<string, number>> = this._turnEnergy.asObservable();

    // _spentEnergy: BehaviorSubject<Map<string, number>> = new BehaviorSubject(this.newMap());
    // spentEnergy: Observable<Map<string, number>> = this._spentEnergy.asObservable();
    
    // _turnEffects: BehaviorSubject<Array<BattleEffect>> = new BehaviorSubject([]);
    // turnEffects: Observable<Array<BattleEffect>> = this._turnEffects.asObservable();
    
    // _activeCharacterPosition: BehaviorSubject<number> = new BehaviorSubject(null);
    // activeCharacterPosition: Observable<number> = this._activeCharacterPosition.asObservable();
    
    // _chosenAbility: BehaviorSubject<Ability> = new BehaviorSubject(null);
    // chosenAbility: Observable<Ability> = this._chosenAbility.asObservable();
    
    // _chosenAbilities: BehaviorSubject<Array<AbilityTargetDTO>> = new BehaviorSubject([]);
    // chosenAbilities: Observable<Array<AbilityTargetDTO>> = this._chosenAbilities.asObservable();
    
    _availableAbilities: BehaviorSubject<Array<number>> = new BehaviorSubject([]);
    availableAbilities: Observable<Array<number>> = this._availableAbilities.asObservable();
    
    _availableTargets: BehaviorSubject<Array<number>> = new BehaviorSubject([]);
    availableTargets: Observable<Array<number>> = this._availableTargets.asObservable();
  playerId: any;

    /// GETTERS SETTERS////

    // getVictory() {
    //   return this.victory;
    // }

    // setVictory(next) {
    //   this._victory.next(next);
    // }

    
    getInBattle() {
      return this.inBattle;
    }

    setInBattle(next) {
      this._inBattle.next(next);
    }

    // getDefeat() {
    //   return this.defeat;
    // }

    // setDefeat(next) {
    //   this._defeat.next(next);
    // }

    getOpponent() {
      return this.opponent;
    }

    setOpponent(next) {
      this._opponent.next(next);
    }

    getBattle() {
      return this.battle;
    }

    setBattle(next) {
      this._battle.next(next);
    }

    getTempAllies() {
      return this.tempAllies;
    }

    setTempAllies(next) {
      this._tempAllies.next(next);
    }

    getEnemies() {
      return this.enemies;
    }

    setEnemies(next) {
      this._enemies.next(next);
    }

        
    getAvailableAbilities() {
      return this.availableAbilities;
    }

    setAvailableAbilities(next) {
      this._availableAbilities.next(next);
    }

    getAvailableTargets() {
      return this.availableTargets;
    }

    setAvailableTargets(next) {
      this._availableTargets.next(next);
    }

    // getHasTurn() {
    //   return this.hasTurn;
    // }

    // setHasTurn(next) {
    //   this._hasTurn.next(next);
    // }

    /// GETTERS SETTERS////

    setAllies(allies) {
      this.allies = allies;
    }

    setArenaId(num : number) {
      this.arenaId = num;
    }

    getPlayer() {
      return this.player;
    }

    getCurrentPlayer() {
      return this.playerSub;
    }

    setPlayer(next) {
      this._player.next(next);
      this.playerSub = next;
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
      this.arenaService.websocketReady.subscribe(x => {
        if (x) {
          this.sendMatchMakingMessage(player.id);
        }
      })
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
      this.arenaService.websocketReady.subscribe(x => {
        if (x) {
          this.sendMatchMakingMessage(player.id);
        }
      })
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
      this.arenaService.websocketReady.subscribe(x => {
        if (x) {
          this.sendMatchMakingMessage(player.id);
        }
      })
    }

    initSocket() {
      this.arenaService.connectByArenaId(this.arenaId);
      this.subscribeToSocket();
    }

    isConnected() {
      return this.arenaService.websocket.readyState === WebSocket.OPEN;
    }

    subscribeToSocket(){
      this.arenaService.socketMessage.subscribe(msg => {
        if (msg){
          let mtp = msg.type;
      
          if (mtp) {
            console.log("::Got Message - Type = " + mtp);
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
              console.log("Unrecognized Message");
            }
          }
        }
      })
    }


    handleInitResponse(msg) {
      let isPlayerOne = msg.battle.playerIdOne === this.playerId;
      if (isPlayerOne){
        this.setPlayer(msg.playerOne);
        this.setOpponent(msg.playerTwo);
        

        let holder1 : Array<Character> = new Array();
        holder1.push(msg.characters[0]);
        holder1.push(msg.characters[1]);
        holder1.push(msg.characters[2]);
        this.setAllies(holder1);

        let holder : Array<Character> = new Array();
        holder.push(msg.characters[3]);
        holder.push(msg.characters[4]);
        holder.push(msg.characters[5]);
        this.setEnemies(holder);

        // this.setBattleAllies(msg.battle.playerOneTeam);
        // this.setBattleEnemies(msg.battle.playerTwoTeam);

        // this.setTurnEnergy(this.copyMap(msg.battle.playerOneEnergy));
        // this.setSpentEnergy(this.newMap());
      
      } else {
        this.setPlayer(msg.playerTwo);
        this.setOpponent(msg.playerOne);


        let holder1 : Array<Character> = new Array();
        holder1.push(msg.characters[3]);
        holder1.push(msg.characters[4]);
        holder1.push(msg.characters[5]);
        this.setAllies(holder1);

        let holder : Array<Character> = new Array();
        holder.push(msg.characters[0]);
        holder.push(msg.characters[1]);
        holder.push(msg.characters[2]);
        this.setEnemies(holder);

        // this.setBattleAllies(msg.battle.playerTwoTeam);
        // this.setBattleEnemies(msg.battle.playerOneTeam);

        // this.setTurnEnergy(this.copyMap(msg.battle.playerTwoEnergy));
        // this.setSpentEnergy(this.newMap()); 
      }

      // TODO: move this to first time setup in subscription
      this.setTempAllies(Object.create(this.allies));

      this.setInBattle(true);
      this.setBattle(msg.battle);
    }


    handleEnergyTradeResponse(msg) {
      // if (this.getIsPlayerOne()) {
      //   this.setTurnEnergy(this.copyMap(msg.battle.playerOneEnergy));
      // } else {
      //   this.setTurnEnergy(this.copyMap(msg.battle.playerTwoEnergy));
      // }
      
      // this.setSpentEnergy(this.newMap());
      this.setBattle(msg.battle);
    }
    
    handleCostCheckResponse(msg) {
      console.log(msg);
      this.setAvailableAbilities(msg.usable);
    }

    handleTargetCheckResponse(msg) {
      this.setAvailableTargets(msg.dto.targetPositions);
    }
    

    handleSurrenderResponse(msg) {
      // TODO: set victory above so it cascades down to component
      if (this.getCurrentPlayer().id === msg.playerId) {
        // this._victory.next(false);
      } else {
        // this._victory.next(true);
      }
      this.setInBattle(false);
      this.setBattle(null);
    }
    

    handleTurnEndResponse(msg) {
      let team;
      let enemyTeam;

      if (msg.isPlayerOne) {
        team = msg.battle.playerOneTeam;
        enemyTeam = msg.battle.playerTwoTeam;
      } else {
        team = msg.battle.playerTwoTeam;
        enemyTeam = msg.battle.playerOneTeam;
      }

      let victory = enemyTeam[0].dead && enemyTeam[1].dead && enemyTeam[2].dead;
      let defeat = team[0].dead && team[1].dead && team[2].dead;

      if (victory) {
        // this.setVictory(true);
        this.setInBattle(false);
      }

      if (defeat) {
        // this.setDefeat(true);
        this.setInBattle(false);
      }
      
      this.setBattle(msg.battle);
    }

    // maybe these live in the component and facade back through the store?  makes the most sense.


    sendMatchMakingMessage(playerId) {
      console.log("::Sent MATCH_MAKING Message");
      this.playerId = playerId;
      let msg = {
        type: "MATCH_MAKING",
        char1: this.allies[0].id,
        char2: this.allies[1].id,
        char3: this.allies[2].id,
        playerId: playerId,
        arenaId: this.arenaId
      };
      this.arenaService.sendWebsocketMessage(JSON.stringify(msg));
    }

    sendCostCheck(allyCosts, chosenAbilities) {
      console.log("::Sent COST_CHECK Message");
      let costCheckDTO : CostCheckDTO = {
        allyCosts : allyCosts,
        chosenAbilities : chosenAbilities
      }
      
      const payload = {
        type: "COST_CHECK",
        playerId: this.getCurrentPlayer().id,
        costCheckDTO: costCheckDTO
      };

      this.arenaService.sendWebsocketMessage(JSON.stringify(payload));
    }

    sendTargetCheck(dto : AbilityTargetDTO){
      console.log("::Sent TARGET_CHECK Message");
      this.arenaService.sendWebsocketMessage(
        JSON.stringify({
          type: "TARGET_CHECK",
          playerId: this.getCurrentPlayer().id,
          abilityTargetDTO: dto
        })
      )
    }

    sendEnergyTrade(energySpent : Map<String, number>, energyGained : string){
      console.log("::Sent ENERGY_TRADE Message");
      console.log(energySpent);
      let enrgy = {
        "STRENGTH": energySpent.get("STRENGTH"),
        "DEXTERITY": energySpent.get("DEXTERITY"),
        "ARCANA": energySpent.get("ARCANA"),
        "DIVINITY": energySpent.get("DIVINITY")
      }
      console.log(enrgy);

      this.arenaService.sendWebsocketMessage(
        JSON.stringify({
          type: "ENERGY_TRADE",
          playerId: this.getCurrentPlayer().id,
          spent: enrgy,
          chosen: energyGained
        })
      )
    }

    surrender() {
      console.log("::Sent SURRENDER Message");
      // just manually kill my team and send turn end
      this.arenaService.sendWebsocketMessage(
        JSON.stringify({
          type: "SURRENDER",
          playerId: this.getCurrentPlayer().id
        })
      )
    }
      
    sendTurnEndMessage(spentEnergy, abilityDTOs, finalEffects) {
      console.log("::Sent TURN_END Message");
      console.log(spentEnergy);
      let enrgy = {
        "STRENGTH": spentEnergy.get("STRENGTH"),
        "DEXTERITY": spentEnergy.get("DEXTERITY"),
        "ARCANA": spentEnergy.get("ARCANA"),
        "DIVINITY": spentEnergy.get("DIVINITY")
      }
      console.log(enrgy);

      let battleTurnDTO : BattleTurnDTO = {
        spentEnergy : enrgy,
        abilities : abilityDTOs,
        effects : finalEffects
      }
  
      const payload = {
        type: "TURN_END",
        playerId: this.getCurrentPlayer().id,
        battleTurnDTO: battleTurnDTO
      }

      console.log(payload);

      this.arenaService.sendWebsocketMessage(
        JSON.stringify(payload)
      );
    }

}
