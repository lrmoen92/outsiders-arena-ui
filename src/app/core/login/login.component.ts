import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LoginStore } from 'src/app/utils/login.store';

@Component({
  selector: 'login-root',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  playerNameOrEmail : string;
  playerName : string;
  playerEmail : string;
  playerPassword : string;
  playerPasswordConfirm : string;
  playerAvatarUrl : string;

  loginButton : boolean = false;
  signupButton : boolean = false;

  createPlayerButton_disabled : Boolean = false;
  loginStore : LoginStore;

  constructor(loginStore : LoginStore) {
    this.loginStore = loginStore;
  }

  showLogin() {
    this.loginButton = true;
  }

  showSignup() {
    this.signupButton = true;
  }
    
  signup() {

    if (this.playerName && this.playerPassword && this.playerEmail) { 
      if (this.playerPassword !== this.playerPasswordConfirm) {
        alert("Your passwords do not match!");
      } else {
        let req = {
          "name" : this.playerName,
          "email" : this.playerEmail,
          "password" : this.playerPassword,
          "avatar" : this.playerAvatarUrl
        };
        this.loginStore.signupPlayer(req);
      }
    } else if (!this.playerName) {
      alert("Please enter a user name");
    } else if (!this.playerPassword) {
      alert("Please enter your password");
    } else if (!this.playerEmail) {
      alert("Please enter a valid email");
    } else if (!this.playerPasswordConfirm) {
      alert("Please confirm your password");
    }
  }

  // Login OR Create User if does not exist.
  // TODO: make this a real login
  login() {
    if (this.playerNameOrEmail && this.playerPassword) {
      // check if email or username
      let at = this.playerNameOrEmail.indexOf("@");
      let dot = this.playerNameOrEmail.indexOf(".")
      if (at > 0 && dot > 0 && dot > at) {
        this.playerEmail = this.playerNameOrEmail;
      } else {
        this.playerName = this.playerNameOrEmail;
      }

      // look into cryptoJS for encrypting these fields TODO:
      let auth = {
        "name" : this.playerName,
        "email" : this.playerEmail,
        "password" : this.playerPassword,
        "avatar" : null
      }

      // build auth object with name or email, and password, and login TODO::
      
      this.loginStore.loginPlayer(auth);
    } else if (!this.playerPassword) {
      alert("Please enter your password");
    } else if (!this.playerNameOrEmail) {
      alert("Please enter your Email or Username");
      
      // implement NPC flag for dev?  not too hard  TODO::
      let disp = "NPC " + (Math.floor(Math.random() * 1000000));
      let aurl = "https://tinyurl.com/y5lpta2s";
    }
  };

}
