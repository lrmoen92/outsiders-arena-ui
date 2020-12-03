import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Player } from '../model/api-models';
import { URLS } from '../utils/constants';

@Injectable(
  {providedIn:'root'}
) 
export class ArenaService {

    httpClient: HttpClient;
    websocket: WebSocket;

    _websocketReady: BehaviorSubject<any> = new BehaviorSubject(false);
    websocketReady: Observable<any> = this._websocketReady.asObservable();

    _socketMessage: BehaviorSubject<any> = new BehaviorSubject(null);
    socketMessage: Observable<any> = this._socketMessage.asObservable();
  
    constructor(httpClient : HttpClient) {
      this.httpClient = httpClient;
    }

    connectToLadder(player) {
      console.log('::Looking For Ladder Match');
      return this.httpClient.get(URLS.playerLadderArena + player.id + '/' + player.level);
    }
  
    connectToQuick(player) {
      console.log('::Looking For Quick Match');
      return this.httpClient.get(URLS.playerQuickArena + player.id + '/' + player.level);
    }
  
    connectByPlayerName(player : Player, name : string) {
      console.log('::Connecting to ' + name);
      return this.httpClient.get(URLS.playerArena + player.id + '/' + name)
    }

    connectByArenaId(arenaId) {
      this.connect(arenaId);
    }

    webSocketOpen() {
      this._websocketReady.next(true);
    }

    connect(arenaId) {
      this.websocket = new WebSocket(URLS.battleSocket + arenaId);
      console.log("::Connected to Arena: " + arenaId);
      this.websocket.onopen = () => {
        this.handleMessage();
        this.webSocketOpen();
      }
      this.websocket.onerror = (e) => {
        console.log(e);
      }
    }

    disconnect() {
      if (this.websocket != null) {
          this.websocket.close();
          this.websocket = null;
          console.log("::Disconnected");
      }
    }

    sendWebsocketMessage(str) {
      if (this.websocket) {
        this.websocket.send(str);
      }
    }

    handleMessage() {
      this.websocket.onmessage = response => {
        this._socketMessage.next(JSON.parse(response.data));
      }
    }

}