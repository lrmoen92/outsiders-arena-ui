import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Player } from '../model/api-models';
import { URLS } from '../utils/constants';



@Injectable(
  {providedIn:'root'}
) 
export class LoginService {

    player : Player;

    httpClient: HttpClient;
  
    constructor(httpClient : HttpClient) {
      this.httpClient = httpClient;
    }

    getPlayer(req) : Observable<Player> {
      return <Observable<Player>> this.httpClient.post(URLS.playerLogin, req);
    }

    setPlayer(player) {
      this.player = player;
    }

    isLoggedIn() {
      return this.player !== null;
    }

    loggedInPlayer() {
      
      console.log("retrieved player from cache");
      console.log(this.player);
      return this.player;
    }
}