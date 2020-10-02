import { HttpClient } from '@angular/common/http';
import { Component, Input, } from '@angular/core';
import { Router } from '@angular/router';
import { Character } from '../model/api-models';

@Component({
  selector: 'nav-root',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent {

  router : Router;
  httpClient: HttpClient;

  constructor(httpClient : HttpClient, router : Router) {
    this.httpClient = httpClient;
    this.router = router;
	}

  goHome(){
    this.router.navigate(['/'])
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
