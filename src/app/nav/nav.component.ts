import { HttpClient } from '@angular/common/http';
import { Component, OnInit, } from '@angular/core';
import { Router } from '@angular/router';
import { LoginStore } from '../utils/login.store';

@Component({
  selector: 'nav-root',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit {

  router : Router;
  httpClient: HttpClient;
  loginStore : LoginStore;
  
  loggedIn: Boolean;

  constructor(httpClient : HttpClient, router : Router, loginStore : LoginStore) {
    this.httpClient = httpClient;
    this.router = router;
    this.loginStore = loginStore;
  }
  
  ngOnInit() {
    this.loginStore.getLoggedIn().subscribe(x => {
      this.loggedIn = x;
      this.goHome();
    });
  }

  goHome(){
    this.router.navigate(['/'])
  }

  goLogout(){
    this.loginStore.logoutPlayer();
    this.router.navigate(['/'])
  }

  goLogin(){
    this.router.navigate(['login'])
  }

  goArena(){
    this.router.navigate(['arena'])
  }

  goMissions(){
    this.router.navigate(['mission'])
  }

  goCharacters(){
    this.router.navigate(['character'])
  }
}
