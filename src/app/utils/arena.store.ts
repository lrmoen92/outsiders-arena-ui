import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { Ability, AbilityTargetDTO, Battle, BattleEffect, BattleTurnDTO, Character, CharacterInstance, CostCheckDTO, GameEnd, Player } from '../model/api-models';
import { ArenaService } from './arena.service';

@Injectable(
  {providedIn:'root'}
) 
export class ArenaStore {

    arenaService : ArenaService;

    arenaId : number;
    queue : string;

    _player : BehaviorSubject<Player> = new BehaviorSubject(null);

    _inBattle: BehaviorSubject<boolean> = new BehaviorSubject(null);
    inBattle: Observable<boolean> = this._inBattle.asObservable();

    _hasTurn: BehaviorSubject<boolean> = new BehaviorSubject(null);
    hasTurn: Observable<boolean> = this._hasTurn.asObservable();
    
    _opponent: BehaviorSubject<Player> = new BehaviorSubject(null);
    opponent: Observable<Player> = this._opponent.asObservable();
    
    _battle: BehaviorSubject<Battle> = new BehaviorSubject(null);
    battle: Observable<Battle> = this._battle.asObservable();
    
    _enemies: BehaviorSubject<Array<Character>> = new BehaviorSubject([]);
    enemies: Observable<Array<Character>> = this._enemies.asObservable();
    
    _availableAbilities: BehaviorSubject<Array<number>> = new BehaviorSubject([]);
    availableAbilities: Observable<Array<number>> = this._availableAbilities.asObservable();
    
    _availableTargets: BehaviorSubject<Array<number>> = new BehaviorSubject([]);
    availableTargets: Observable<Array<number>> = this._availableTargets.asObservable();

    _victory: BehaviorSubject<GameEnd> = new BehaviorSubject(null);
    victory: Observable<GameEnd> = this._victory.asObservable();

    playerId: number;
    loserId: number;
    winnerId: number;

    getVictory() {
      return this.victory;
    }

    setVictory(next : GameEnd) {
      this._victory.next(next);
    }

    
    arenaIdSub : Subscription;
    socketSub : Subscription;
    socketReadySub : Subscription;


    /// GETTERS SETTERS////

    getInBattle() {
      return this.inBattle;
    }

    setInBattle(next) {
      this._inBattle.next(next);
    }

    getBattle() {
      return this.battle;
    }

    setBattle(next) {
      this._battle.next(next);
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



    getOpponent() {
      return this.opponent;
    }

    setOpponent(next) {
      this._opponent.next(next);
    }

    getCurrentOpponent() {
      return this._opponent.getValue();
    }

    getCurrentPlayer() {
      return this._player.getValue();
    }

    setPlayer(next) {
      this._player.next(next);
    }


    setArenaId(num : number) {
      this.arenaId = num;
    }

    setQueue(queue : string) {
      this.queue = queue;
    }

    constructor(arenaService : ArenaService) {
      this.arenaService = arenaService;
    }

    connectToLadder(player, allies) {
      console.log('::Looking For Ladder Match');
      this.setQueue("LADDER");

      this.arenaIdSub = this.subscribeToQueue(this.arenaService.connectToLadder(player));
      this.socketReadySub = this.subscribeToArenaSocket(player, allies);
    }
  
    connectToQuick(player, allies) {
      console.log('::Looking For Quick Match');
      this.setQueue("QUICK");

      this.arenaIdSub = this.subscribeToQueue(this.arenaService.connectToQuick(player));
      this.socketReadySub = this.subscribeToArenaSocket(player, allies);
    }
  
    connectByPlayerName(player : Player, name : string, allies) {
      console.log('::Connecting to ' + name);
      this.setQueue("PRIVATE");

      this.arenaIdSub = this.subscribeToQueue(this.arenaService.connectByPlayerName(player, name));
      this.socketReadySub = this.subscribeToArenaSocket(player, allies);
    }

    subscribeToQueue(queue : Observable<Object>) : Subscription {
      return queue.subscribe(
        x => {
          this.setArenaId(<number> x);
        },
        y => {

        },
        () => {
          this.initSocket();
        }
      );
    }

    subscribeToArenaSocket(player : Player, allies) : Subscription {
      return this.arenaService.websocketReady.subscribe(x => {
        if (x) {
          this.sendMatchMakingMessage(player.id, this.queue, allies);
        }
      })
    }

    initSocket() {
      this.arenaService.connectByArenaId(this.arenaId);
      this.socketSub = this.subscribeToSocket();
    }

    disconnect() {
      this.arenaIdSub.unsubscribe();
      this.socketSub.unsubscribe();
      this.socketReadySub.unsubscribe();
      this.arenaId = null;
      this.queue = null;
      this.playerId = null;
      this.loserId = null;
      this.winnerId = null;
      this.clearObservables();
      this.arenaService.disconnect();
    }

    clearObservables() {
      this._inBattle = new BehaviorSubject(null);
      this._hasTurn = new BehaviorSubject(null);
      this._opponent = new BehaviorSubject(null);
      this._battle = new BehaviorSubject(null);
      this._enemies = new BehaviorSubject([]);
      this._availableAbilities = new BehaviorSubject([]);
      this._availableTargets = new BehaviorSubject([]);
      this._victory = new BehaviorSubject(null);

      this.inBattle = this._inBattle.asObservable();
      this.hasTurn = this._hasTurn.asObservable();
      this.opponent = this._opponent.asObservable();
      this.battle = this._battle.asObservable();
      this.enemies = this._enemies.asObservable();
      this.availableAbilities = this._availableAbilities.asObservable();
      this.availableTargets = this._availableTargets.asObservable();
      this.victory = this._victory.asObservable();
    }

    isConnected() {
      return this.arenaService.websocket.readyState === WebSocket.OPEN;
    }

    subscribeToSocket() : Subscription {
      return this.arenaService.socketMessage.subscribe(msg => {
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
            } else if (mtp === "GAME_END") {
              this.handleGameEndResponse(msg);
            } else {
              console.log("Unrecognized Message");
            }
          }
        }
      })
    }


    handleInitResponse(msg) {
      console.log(msg);
      let isPlayerOne = msg.battle.playerIdOne === this.playerId;
      if (isPlayerOne){
        this.setPlayer(msg.playerOne);
        this.setOpponent(msg.playerTwo);
      } else {
        this.setPlayer(msg.playerTwo);
        this.setOpponent(msg.playerOne);
      }
      this.setInBattle(true);
      this.setBattle(msg.battle);
      console.log("END OF INIT");
    }


    handleEnergyTradeResponse(msg) {
      this.setBattle(msg.battle);
    }
    
    handleCostCheckResponse(msg) {
      this.setAvailableAbilities(msg.usable);
    }

    handleTargetCheckResponse(msg) {
      this.setAvailableTargets(msg.dto.targetPositions);
    }
    

    handleGameEndResponse(msg) {
      console.log("GAME END RESPONSE");
      console.log(msg);
      console.log("CURRENT ID" + this.getCurrentPlayer().id);
      console.log("LOSER ID" + this.loserId);
      
      let gameEnd = new GameEnd();
      if (this.getCurrentPlayer().id === this.loserId) {
        gameEnd.victory = false;
        gameEnd.progressString = msg.loserString;
        gameEnd.player = msg.loser;
        this.setVictory(gameEnd);
      } else {
        gameEnd.victory = true;
        gameEnd.progressString = msg.winnerString;
        gameEnd.player = msg.winner
        this.setVictory(gameEnd);
      }
      this.setInBattle(false);
      this.disconnect();
    }
    

    handleTurnEndResponse(msg) {
      let enemyTeam;

      if (msg.isPlayerOne) {
        enemyTeam = msg.battle.playerTwoTeam;
      } else {
        enemyTeam = msg.battle.playerOneTeam;
      }

      let victory = enemyTeam[0].hp <= 0 && enemyTeam[1].hp <= 0 && enemyTeam[2].hp <= 0;

      if (victory) {
        this.loserId = this.getCurrentOpponent().id;
        this.winnerId = this.getCurrentPlayer().id;
        this.sendGameEndMessage();
      }
      
      this.setBattle(msg.battle);
    }


    sendMatchMakingMessage(playerId, queue, allies) {
      console.log("::Sent MATCH_MAKING Message");
      this.playerId = playerId;
      let msg = {
        type: "MATCH_MAKING",
        queue: queue,
        char1: allies[0].id,
        char2: allies[1].id,
        char3: allies[2].id,
        playerId: playerId,
        arenaId: this.arenaId
      };
      this.arenaService.sendWebsocketMessage(JSON.stringify(msg));
    }

    sendCostCheck(allyCosts, chosenAbilities, spentEnergy) {
      console.log("::Sent COST_CHECK Message");
      let costCheckDTO : CostCheckDTO = {
        allyCosts : allyCosts,
        chosenAbilities : chosenAbilities,
        spentEnergy : spentEnergy
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

    sendEnergyTrade(energySpent : Array<string>, energyGained : string){
      console.log("::Sent ENERGY_TRADE Message");
      this.arenaService.sendWebsocketMessage(
        JSON.stringify({
          type: "ENERGY_TRADE",
          playerId: this.getCurrentPlayer().id,
          spent: energySpent,
          chosen: energyGained
        })
      )
    }

    surrender() {
      console.log("::Sent SURRENDER Message");
      console.log("Winner: " + this.winnerId + " Loser: " + this.loserId)
      this.loserId = this.getCurrentPlayer().id;
      this.winnerId = this.getCurrentOpponent().id;
      // just manually kill my team and send turn end
      this.sendGameEndMessage();
    }

    sendGameEndMessage() {
      this.arenaService.sendWebsocketMessage(
        JSON.stringify({
          type: "GAME_END",
          loserId: this.loserId,
          winnerId: this.winnerId,
          arenaId: this.arenaId
        })
      )
    }
      
    sendTurnEndMessage(spentEnergy, abilityDTOs, finalEffects) {
      console.log("::Sent TURN_END Message");
      
      let enrgy = {
        "STRENGTH": spentEnergy.get("STRENGTH"),
        "DEXTERITY": spentEnergy.get("DEXTERITY"),
        "ARCANA": spentEnergy.get("ARCANA"),
        "DIVINITY": spentEnergy.get("DIVINITY")
      }

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
