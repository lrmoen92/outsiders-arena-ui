import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Player } from 'src/app/model/api-models';
import { LoginService } from './login.service';

@Injectable(
  {providedIn:'root'}
) 
export class LoginStore {

  loginService : LoginService;

  _player: BehaviorSubject<Player> = new BehaviorSubject(null);
  player: Observable<Player> = this._player.asObservable();

  _loggedIn: BehaviorSubject<Boolean> = new BehaviorSubject(false);
  loggedIn: Observable<Boolean> = this._loggedIn.asObservable();

  constructor(loginService: LoginService) {
    this.loginService = loginService;
  }

  getLoggedIn() {
    return this.loggedIn;
  }

  getPlayer() {
    return this.player;
  }

  setLoggedIn(input) {
    this._loggedIn.next(input);
  }

  setPlayer(input) {
    this._player.next(input);
  }

  logoutPlayer() {
    this.setPlayer(null);
    this.setLoggedIn(false);
  }

  loginPlayer(req) {
    this.loginService.initPlayer(req).subscribe(
      x => {
        this.setPlayer(x);
        this.setLoggedIn(true);
      },
      y => {},
      () => {},
    );
  }
}