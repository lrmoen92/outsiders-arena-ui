import { Component, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Player, Character } from '../model/api-models';
import { URLS } from '../utils/constants';
import { Router } from '@angular/router';
import { LoginService } from './login.service';

@Component({
  selector: 'login-root',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  httpClient : HttpClient;
  
  loggedIn : Boolean = false;

  playerName : string;
  playerAvatarUrl : string;

  createPlayerButton_disabled : Boolean = false;
  service: LoginService;

  constructor(httpClient : HttpClient, service : LoginService) {
    this.httpClient = httpClient;
    this.service = service;
  }

    
  // Login OR Create User if does not exist.
  // TODO: make this a real login
  login() {
    let disp = this.playerName || "NPC";
    let aurl = this.playerAvatarUrl || "https://i.imgur.com/sdOs51i.jpg";
    let req = {
        "displayName": disp,
        "avatarUrl": aurl
    };
    this.service.getPlayer(req).subscribe(
      x => {
        this.service.setPlayer(<Player> x);
      },
      y => {

      },
      () => {
        this.loggedIn = this.service.isLoggedIn();
        console.log("Player logged in");

      }
    )
  };

}
