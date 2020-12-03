import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Player } from '../model/api-models';
import { URLS } from '../utils/constants';



@Injectable(
  {providedIn:'root'}
) 
export class LoginService {

    httpClient: HttpClient;
  
    constructor(httpClient : HttpClient) {
      this.httpClient = httpClient;
    }

    loginPlayer(req) : Observable<Player> {
      return <Observable<Player>> this.httpClient.post(URLS.playerLogin, req);
    }

    signupPlayer(req) : Observable<Player> {
      return <Observable<Player>> this.httpClient.post(URLS.playerSignup, req);
    }
    
}