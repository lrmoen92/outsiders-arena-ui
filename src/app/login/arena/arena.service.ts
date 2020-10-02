import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, scheduled } from 'rxjs';
import { Battle, Character, CharacterInstance, Player } from 'src/app/model/api-models';
import { URLS } from 'src/app/utils/constants';

@Injectable(
  {providedIn:'root'}
) 
export class ArenaService implements OnDestroy {

    arenaId : Number;

    hasTurn : boolean;
    isPlayerOne : boolean;

    opponent : Player;

    allies : Array<Character>;
    enemies : Array<Character>;
    tempAllies : Array<Character>;
    battleAllies : Array<CharacterInstance>;
    battleEnemies : Array<CharacterInstance>;
    
    energy : Map<string, Number>;
    spent : Map<string, Number>;

    battle : Battle;
    httpClient: HttpClient;
    websocket: WebSocket;
  
    constructor(httpClient : HttpClient) {
      this.httpClient = httpClient;
    }

    ngOnDestroy() {
      console.log("ARENA SERVICE DESTROYED");
    }

    setWebSocket(arenaId) {
      this.websocket = new WebSocket(URLS.battleSocket + arenaId);
    }

    setWebSocketDirect(websocket) {
      this.websocket = websocket;
    }

    getCurrentWebSocket() {
      return this.websocket;
    }

    setArenaId(id: Number) {
      this.arenaId = id;
    }

    getArenaId() {
      return this.arenaId;
    }

    setState(battle : Battle, player : Player) {
      this.setBattle(battle);
      this.setOpponent(player);

      if (this.notInBattle()) {
        this.arenaId = null;
        this.websocket = null;
        this.setOpponent(null);
        this.setBattleAllies(null);
        this.setBattleEnemies(null);
        this.setTempAllies(null);
        this.setAllies(null);
        this.setSpent(null);
        this.setEnergy(null);
      }
    }

    setBattle(battle : Battle) {
      this.battle = battle;
    }

    setOpponent(player : Player) {
      this.opponent = player;
    }

    setEnemies(bool) {
      this.enemies = bool;
    }

    getEnemies() {
      return this.enemies;
    }

    setBattleEnemies(bool) {
      this.battleEnemies = bool;
    }

    getBattleEnemies() {
      return this.battleEnemies;
    }



    setEnergy(bool) {
      this.energy = bool;
    }

    getEnergy() {
      return this.energy;
    }


    setSpent(bool) {
      this.spent = bool;
    }

    getSpent() {
      return this.spent;
    }

    setBattleAllies(bool) {
      this.battleAllies = bool;
    }

    getBattleAllies() {
      return this.battleAllies;
    }


    setTempAllies(bool) {
      this.tempAllies = bool;
    }

    getTempAllies() {
      return this.tempAllies;
    }


    setAllies(bool) {
      this.allies = bool;
    }

    getAllies() {
      return this.allies;
    }

    setHasTurn(bool) {
      this.hasTurn = bool;
    }

    getHasTurn() {
      return this.hasTurn;
    }

    setIsPlayerOne(bool) {
      this.isPlayerOne = bool;
    }
    
    getIsPlayerOne() {
      return this.isPlayerOne;
    }

    isInBattle(): boolean {
      return this.battle !== null && this.battle !== undefined;
    }

    notInBattle(): boolean {
      return this.battle === null || this.battle === undefined;
    }

    getCurrentBattle() {
      return this.battle;
    }

    getCurrentOpponent() {
      return this.opponent;
    }
}