import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LoginStore } from 'src/app/utils/login.store';

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
    let disp = this.playerName || "NPC " + (Math.floor(Math.random() * 1000000));
    let dndIcon = "https://i.imgur.com/sdOs51i.jpg";
    
    let aurl = this.playerAvatarUrl || "https://tinyurl.com/y5lpta2s";
    let req = {
        "displayName": disp,
        "avatarUrl": aurl
    };
    this.loginStore.loginPlayer(req);
  };

}
