import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Player } from '../model/api-models';
import { LoginService } from './login.service';
import { CharacterService } from '../character/character.service';
import { LoginStore } from './login.store';
import { CharacterStore } from '../character/character.store';

@Component({
  selector: 'login-root',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  httpClient : HttpClient;

  playerName : string;
  playerAvatarUrl : string;

  createPlayerButton_disabled : Boolean = false;
  loginStore : LoginStore;

  constructor(httpClient : HttpClient, loginStore : LoginStore) {
    this.httpClient = httpClient;
    this.loginStore = loginStore;
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
    this.loginStore.loginPlayer(req);
    // .subscribe(
    //   x => {
    //     this.service.setPlayer(<Player> x);
    //   },
    //   y => {

    //   },
    //   () => {
        
    //   }
    // )
  };

}
