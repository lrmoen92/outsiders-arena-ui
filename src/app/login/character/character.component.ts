import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit, } from '@angular/core';
import { Character } from 'src/app/model/api-models';
import { ArenaService } from '../arena/arena.service';
import { LoginService } from '../login.service';
import { CharacterService } from './character.service';

@Component({
  selector: 'character-root',
  templateUrl: './character.component.html',
  styleUrls: ['./character.component.css']
})
export class CharacterComponent implements OnInit {

  allCharacters : Array<Character>;
  httpClient: HttpClient;
  service: CharacterService;
  loginService: LoginService;
  arenaService: ArenaService;

	constructor(
		httpClient : HttpClient, 
		service : CharacterService, 
		loginService : LoginService,
		arenaService : ArenaService
	) {
		this.httpClient = httpClient;
		this.service = service;
		this.loginService = loginService;
		this.arenaService = arenaService;
  }
  
  ngOnInit() {
      this.service.getCharacters().subscribe(
        x => {
          this.service.setCharacters(<any[]> x);
        },
        y => {
      
        },
        () => {
          this.allCharacters = this.service.getAllCharacters();
        }
      );
  }
}
