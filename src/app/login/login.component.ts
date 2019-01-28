import { Component, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Player, Character } from '../model/api-models';
import { URLS } from '../utils/constants';

@Component({
  selector: 'login-root',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
    
  @Input()
  allCharacters : Array<Character>;


  httpClient : HttpClient;
  
  loggedIn : Boolean = false;

  playerId : Number;
  player : Player;

  playerName : string;
  playerAvatarUrl : string;


  createPlayerButton_disabled : Boolean = false;

  constructor(httpClient : HttpClient) {
    this.httpClient = httpClient;
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
    this.httpClient.post(URLS.playerLogin, req).subscribe(
      x => {
        console.log(x);
        let player : Player = <Player> x;
        this.playerId = player.id
      this.player = player;
      this.loggedIn = true;
      },
      y => {

      },
      () => {
        console.log("Player logged in");
      }
    )
  }
}
